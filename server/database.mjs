import pg from "pg";
import { resetAccessTenantData } from "./seed.mjs";
import { assertTransitionAllowed, WorkflowError } from "./workflow.mjs";

const { Pool } = pg;

export const DEFAULT_DATABASE_URL = "postgresql://localhost/orderops_cloud";

export function createPool(databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL) {
  const serverless = process.env.VERCEL === "1";
  const configuredMax = process.env.DATABASE_POOL_MAX;
  const max = configuredMax === undefined ? (serverless ? 2 : 10) : Number(configuredMax);
  if (!Number.isInteger(max) || max < 1 || max > 50) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 50.");
  }

  return new Pool({
    connectionString: databaseUrl,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: serverless,
  });
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    tenant: {
      id: row.tenant_id,
      slug: row.tenant_slug,
      name: row.tenant_name,
    },
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    orderedAt: row.ordered_at,
    customerName: row.customer_name,
    maskedPhone: row.masked_phone,
    region: row.region,
    productName: row.product_name,
    quantity: row.quantity,
    lane: row.lane,
    priority: row.priority,
    status: row.status,
    exceptions: row.exceptions ?? [],
    normalizationNotes: row.normalization_notes ?? [],
    warehouse: row.warehouse,
    shippingLine: row.shipping_line,
    totalAmount: row.total_amount,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

function mapAudit(row) {
  return {
    id: String(row.id),
    action: row.action,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    note: row.note,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    createdAt: row.created_at,
  };
}

export function createPostgresStore(pool) {
  return {
    async health() {
      const result = await pool.query("select current_database() as database, now() as checked_at");
      return result.rows[0];
    },

    async findUserForLogin(tenantSlug, email) {
      const result = await pool.query(
        `select u.*, t.slug as tenant_slug, t.name as tenant_name
           from users u
           join tenants t on t.id = u.tenant_id
          where t.slug = $1 and lower(u.email) = lower($2) and u.active = true`,
        [tenantSlug, email],
      );
      return result.rows[0] ?? null;
    },

    async createSession(userId, tenantId, tokenHash, expiresAt) {
      await pool.query("delete from sessions where expires_at <= now()");
      await pool.query(
        `insert into sessions (user_id, tenant_id, token_hash, expires_at)
         values ($1, $2, $3, $4)`,
        [userId, tenantId, tokenHash, expiresAt],
      );
    },

    async findSession(tokenHash) {
      const result = await pool.query(
        `select u.*, t.slug as tenant_slug, t.name as tenant_name
           from sessions s
           join users u on u.id = s.user_id and u.tenant_id = s.tenant_id
           join tenants t on t.id = u.tenant_id
          where s.token_hash = $1 and s.expires_at > now() and u.active = true`,
        [tokenHash],
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },

    async deleteSession(tokenHash) {
      await pool.query("delete from sessions where token_hash = $1", [tokenHash]);
    },

    async deleteExpiredSessions() {
      const result = await pool.query("delete from sessions where expires_at <= now()");
      return result.rowCount;
    },

    async listAccessAccounts() {
      const result = await pool.query(
        `select u.email, u.name, u.role, t.slug as tenant_slug, t.name as tenant_name
           from users u
           join tenants t on t.id = u.tenant_id
          where u.is_access_account = true and u.active = true
          order by t.name, case u.role when 'admin' then 1 when 'operator' then 2 else 3 end`,
      );
      return result.rows.map((row) => ({
        email: row.email,
        name: row.name,
        role: row.role,
        tenantSlug: row.tenant_slug,
        tenantName: row.tenant_name,
      }));
    },

    async resetAccessTenant(tenantId) {
      await resetAccessTenantData(pool, tenantId);
    },

    async listOrders(tenantId, filters = {}) {
      const values = [tenantId];
      const clauses = ["tenant_id = $1"];

      if (filters.query) {
        values.push(`%${filters.query}%`);
        const index = values.length;
        clauses.push(`(
          order_number ilike $${index}
          or customer_name ilike $${index}
          or region ilike $${index}
          or product_name ilike $${index}
        )`);
      }

      if (filters.status) {
        values.push(filters.status);
        clauses.push(`status = $${values.length}`);
      }

      if (filters.exceptionsOnly) clauses.push("cardinality(exceptions) > 0");

      const result = await pool.query(
        `select * from orders
          where ${clauses.join(" and ")}
          order by ordered_at desc, order_number desc
          limit 100`,
        values,
      );
      return result.rows.map(mapOrder);
    },

    async getMetrics(tenantId) {
      const [totals, statuses] = await Promise.all([
        pool.query(
          `select count(*)::int as total,
                  count(*) filter (where cardinality(exceptions) > 0)::int as exceptions,
                  count(*) filter (where status = 'ready')::int as ready,
                  count(*) filter (where status = 'shipped')::int as shipped,
                  coalesce(sum(total_amount), 0)::int as total_amount,
                  max(updated_at) as last_updated_at
             from orders
            where tenant_id = $1`,
          [tenantId],
        ),
        pool.query(
          `select status, count(*)::int as count
             from orders
            where tenant_id = $1
            group by status`,
          [tenantId],
        ),
      ]);

      const totalRow = totals.rows[0];
      return {
        total: totalRow.total,
        exceptions: totalRow.exceptions,
        ready: totalRow.ready,
        shipped: totalRow.shipped,
        totalAmount: totalRow.total_amount,
        lastUpdatedAt: totalRow.last_updated_at,
        statusCounts: Object.fromEntries(statuses.rows.map((row) => [row.status, row.count])),
      };
    },

    async getAudit(tenantId, orderId, limit = 30) {
      const order = await pool.query(
        "select 1 from orders where tenant_id = $1 and id = $2",
        [tenantId, orderId],
      );
      if (!order.rowCount) {
        throw new WorkflowError("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", 404);
      }

      const result = await pool.query(
        `select a.*
           from audit_events a
          where a.tenant_id = $1 and a.order_id = $2
          order by a.created_at desc, a.id desc
          limit $3`,
        [tenantId, orderId, limit],
      );
      return result.rows.map(mapAudit);
    },

    async transitionOrder({ tenantId, orderId, actor, toStatus, expectedVersion, note }) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(
          "select pg_advisory_xact_lock(hashtext('orderops-shared-access'), hashtext($1::text))",
          [tenantId],
        );
        const selected = await client.query(
          "select * from orders where id = $1 and tenant_id = $2 for update",
          [orderId, tenantId],
        );
        const current = selected.rows[0];
        if (!current) throw new WorkflowError("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", 404);
        if (current.version !== expectedVersion) {
          throw new WorkflowError(
            "VERSION_CONFLICT",
            "다른 사용자가 먼저 주문을 변경했습니다. 최신 상태를 다시 불러와 주세요.",
            409,
          );
        }

        assertTransitionAllowed(actor.role, current.status, toStatus);
        const nextExceptions =
          toStatus === "ready"
            ? []
            : toStatus === "exception" && current.exceptions.length === 0
              ? ["수동검수"]
              : current.exceptions;
        const updated = await client.query(
          `update orders
              set status = $1,
                  exceptions = $2,
                  version = version + 1,
                  updated_at = now()
            where id = $3 and tenant_id = $4
          returning *`,
          [toStatus, nextExceptions, orderId, tenantId],
        );
        const audit = await client.query(
          `insert into audit_events
             (tenant_id, order_id, actor_user_id, actor_name, actor_role, action, from_status, to_status, note)
           values ($1, $2, $3, $4, $5, 'order.status_changed', $6, $7, $8)
           returning *`,
          [tenantId, orderId, actor.id, actor.name, actor.role, current.status, toStatus, note || null],
        );
        await client.query("commit");
        return { order: mapOrder(updated.rows[0]), audit: mapAudit(audit.rows[0]) };
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
