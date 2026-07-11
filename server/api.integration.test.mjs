import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.mjs";
import { createPool, createPostgresStore } from "./database.mjs";
import { seedDatabase } from "./seed.mjs";

let pool;
let server;
let baseUrl;
const accessPassword = process.env.ACCESS_ACCOUNT_PASSWORD || "orderops-access-2026";
const mutationHeader = { "x-orderops-request": "1" };

before(async () => {
  pool = createPool();
  await seedDatabase(pool);
  const app = createApp({ store: createPostgresStore(pool), production: false });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await seedDatabase(pool);
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await pool.end();
});

async function login(tenantSlug, role) {
  const tenantEmailDomain = tenantSlug === "seoul-fresh"
    ? "seoulfresh.example"
    : "busancraft.example";
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({
      tenantSlug,
      email: `${role}@${tenantEmailDomain}`,
      password: accessPassword,
    }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /orderops_session=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.equal((await response.json()).user.sharedAccessMode, false);
  return cookie.split(";")[0];
}

test("라이브 상태와 DB 준비 상태를 서로 분리해 공개한다", async () => {
  const live = await fetch(`${baseUrl}/api/health/live`);
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), { ok: true, service: "orderops-api" });
  assert.equal(live.headers.get("x-content-type-options"), "nosniff");
  assert.equal(live.headers.get("x-frame-options"), "DENY");
  assert.equal(live.headers.get("x-powered-by"), null);

  const ready = await fetch(`${baseUrl}/api/health/ready`);
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { ok: true, service: "orderops-api", database: "ready" });
});

test("상태 변경 요청은 같은 출처 표식이 없으면 인증 전에 거부한다", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tenantSlug: "seoul-fresh",
      email: "admin@seoulfresh.example",
      password: accessPassword,
    }),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "CSRF_REJECTED");
});

test("반복되는 로그인 실패는 같은 계정과 접속 주소 기준으로 제한한다", async () => {
  const request = () => fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({
      tenantSlug: "seoul-fresh",
      email: "missing@seoulfresh.example",
      password: "wrong-password",
    }),
  });

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await request();
    assert.equal(response.status, 401);
  }
  const limited = await request();
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error.code, "LOGIN_RATE_LIMITED");
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
});

test("운영 담당자의 상태 변경은 DB와 감사 로그에 함께 남는다", async () => {
  const cookie = await login("seoul-fresh", "operator");
  const ordersResponse = await fetch(`${baseUrl}/api/orders`, { headers: { cookie } });
  const { orders } = await ordersResponse.json();
  assert.equal(orders.length, 6);
  assert.ok(orders.every((order) => order.id.startsWith("sf-")));

  const transitionResponse = await fetch(`${baseUrl}/api/orders/sf-1001/status`, {
    method: "PATCH",
    headers: { cookie, ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({ status: "shipped", expectedVersion: 3, note: "통합 테스트" }),
  });
  assert.equal(transitionResponse.status, 200);
  const transition = await transitionResponse.json();
  assert.equal(transition.order.status, "shipped");
  assert.equal(transition.order.version, 4);

  const auditResponse = await fetch(`${baseUrl}/api/orders/sf-1001/audit`, { headers: { cookie } });
  const { audit } = await auditResponse.json();
  assert.equal(audit[0].actorRole, "operator");
  assert.equal(audit[0].fromStatus, "ready");
  assert.equal(audit[0].toStatus, "shipped");
  assert.equal(audit[0].note, "통합 테스트");
  assert.equal(audit[1].note, "초기 주문 상태 등록");
});

test("열람 전용 역할의 변경 요청은 서버에서 403으로 거부된다", async () => {
  const cookie = await login("seoul-fresh", "viewer");
  const response = await fetch(`${baseUrl}/api/orders/sf-1003/status`, {
    method: "PATCH",
    headers: { cookie, ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({ status: "ready", expectedVersion: 1 }),
  });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.code, "TRANSITION_FORBIDDEN");
});

test("다른 회사 주문은 존재 여부를 숨기고 404로 응답한다", async () => {
  const cookie = await login("busan-craft", "admin");
  const response = await fetch(`${baseUrl}/api/orders/sf-1006/status`, {
    method: "PATCH",
    headers: { cookie, ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({ status: "shipped", expectedVersion: 2 }),
  });
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "ORDER_NOT_FOUND");
});

test("오래된 버전으로 변경하면 동시 수정 충돌을 반환한다", async () => {
  const cookie = await login("seoul-fresh", "admin");
  const response = await fetch(`${baseUrl}/api/orders/sf-1003/status`, {
    method: "PATCH",
    headers: { cookie, ...mutationHeader, "content-type": "application/json" },
    body: JSON.stringify({ status: "ready", expectedVersion: 99 }),
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error.code, "VERSION_CONFLICT");
});

test("다른 회사 주문의 감사 기록도 존재 여부를 숨기고 404로 응답한다", async () => {
  const cookie = await login("busan-craft", "admin");
  const response = await fetch(`${baseUrl}/api/orders/sf-1001/audit`, { headers: { cookie } });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "ORDER_NOT_FOUND");
});

test("모호한 다중 주문 필터는 조용히 허용하지 않고 400으로 거부한다", async () => {
  const cookie = await login("seoul-fresh", "viewer");
  const response = await fetch(`${baseUrl}/api/orders?status=ready&status=shipped`, {
    headers: { cookie },
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "FILTER_INVALID");
});

test("로그아웃은 현재 서버 세션을 폐기한다", async () => {
  const cookie = await login("seoul-fresh", "viewer");
  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { cookie, ...mutationHeader },
  });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
  assert.equal(me.status, 401);
  assert.equal((await me.json()).error.code, "SESSION_EXPIRED");
});

test("감사 이벤트는 일반 DB 작업으로 수정하거나 삭제할 수 없다", async () => {
  const event = await pool.query(
    "select id from audit_events where tenant_id = $1 order by id desc limit 1",
    ["tenant-seoul-fresh"],
  );
  const eventId = event.rows[0].id;

  await assert.rejects(
    pool.query("update audit_events set note = 'tampered' where id = $1", [eventId]),
    (error) => error.code === "55000",
  );
  await assert.rejects(
    pool.query("delete from audit_events where id = $1", [eventId]),
    (error) => error.code === "55000",
  );
});

test("공유 접근 모드는 tenant만 초기화하고 입력 메모와 과도한 쓰기를 제한한다", async () => {
  await seedDatabase(pool);
  const sharedAccessApp = createApp({
    store: createPostgresStore(pool),
    production: false,
    sharedAccessMode: true,
    sharedAccessMutationLimits: { sessionLimit: 2, ipLimit: 20, windowMs: 60_000 },
    sharedAccessLoginResetLimits: { limit: 2, windowMs: 60_000 },
  });
  const sharedAccessServer = sharedAccessApp.listen(0, "127.0.0.1");
  await new Promise((resolve) => sharedAccessServer.once("listening", resolve));
  const address = sharedAccessServer.address();
  const sharedAccessBaseUrl = `http://127.0.0.1:${address.port}`;

  async function sharedAccessLogin() {
    const response = await fetch(`${sharedAccessBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { ...mutationHeader, "content-type": "application/json" },
      body: JSON.stringify({
        tenantSlug: "seoul-fresh",
        email: "operator@seoulfresh.example",
        password: accessPassword,
      }),
    });
    const body = await response.json();
    return {
      response,
      body,
      cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
    };
  }

  try {
    const accounts = await fetch(`${sharedAccessBaseUrl}/api/auth/access-accounts`);
    assert.equal(accounts.status, 200);
    const accountsBody = await accounts.json();
    assert.equal(accountsBody.sharedAccessMode, true);
    assert.equal(accountsBody.accounts.length, 6);
    assert.ok(accountsBody.accounts.every(({ email }) => (
      email.endsWith("@seoulfresh.example") || email.endsWith("@busancraft.example")
    )));

    const firstLogin = await sharedAccessLogin();
    assert.equal(firstLogin.response.status, 200);
    assert.equal(firstLogin.body.user.sharedAccessMode, true);
    assert.match(firstLogin.cookie, /orderops_session=/);

    const firstTransition = await fetch(`${sharedAccessBaseUrl}/api/orders/sf-1001/status`, {
      method: "PATCH",
      headers: { cookie: firstLogin.cookie, ...mutationHeader, "content-type": "application/json" },
      body: JSON.stringify({ status: "shipped", expectedVersion: 3, note: "저장되면 안 되는 외부 입력" }),
    });
    assert.equal(firstTransition.status, 200);
    assert.equal((await firstTransition.json()).audit.note, "공개 환경에서 수행한 상태 변경");

    const secondLogin = await sharedAccessLogin();
    assert.equal(secondLogin.response.status, 200);

    const preserved = await pool.query(
      `select
         (select count(*)::int from users where tenant_id = $1) as users,
         (select count(*)::int from sessions where tenant_id = $1) as sessions,
         (select status from orders where tenant_id = $1 and id = 'sf-1001') as status`,
      ["tenant-seoul-fresh"],
    );
    assert.deepEqual(preserved.rows[0], { users: 3, sessions: 2, status: "ready" });

    const originalSession = await fetch(`${sharedAccessBaseUrl}/api/auth/me`, {
      headers: { cookie: firstLogin.cookie },
    });
    assert.equal(originalSession.status, 200);
    assert.equal((await originalSession.json()).user.sharedAccessMode, true);

    const secondTransition = await fetch(`${sharedAccessBaseUrl}/api/orders/sf-1003/status`, {
      method: "PATCH",
      headers: { cookie: firstLogin.cookie, ...mutationHeader, "content-type": "application/json" },
      body: JSON.stringify({ status: "ready", expectedVersion: 1 }),
    });
    assert.equal(secondTransition.status, 200);

    const limitedMutation = await fetch(`${sharedAccessBaseUrl}/api/orders/sf-1003/status`, {
      method: "PATCH",
      headers: { cookie: firstLogin.cookie, ...mutationHeader, "content-type": "application/json" },
      body: JSON.stringify({ status: "shipped", expectedVersion: 2 }),
    });
    assert.equal(limitedMutation.status, 429);
    assert.equal((await limitedMutation.json()).error.code, "SHARED_ACCESS_MUTATION_RATE_LIMITED");
    assert.ok(Number(limitedMutation.headers.get("retry-after")) > 0);

    const limitedLogin = await sharedAccessLogin();
    assert.equal(limitedLogin.response.status, 429);
    assert.equal(limitedLogin.body.error.code, "SHARED_ACCESS_LOGIN_RATE_LIMITED");
    assert.ok(Number(limitedLogin.response.headers.get("retry-after")) > 0);
  } finally {
    await new Promise((resolve, reject) =>
      sharedAccessServer.close((error) => (error ? reject(error) : resolve())),
    );
    await seedDatabase(pool);
  }
});
