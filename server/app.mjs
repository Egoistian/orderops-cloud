import express from "express";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./security.mjs";
import { allowedTransitions, ORDER_STATUSES, WorkflowError } from "./workflow.mjs";

const SESSION_COOKIE = "orderops_session";
const SESSION_SECONDS = 60 * 60 * 8;
const MUTATION_HEADER = "x-orderops-request";
const DUMMY_PASSWORD_HASH = hashPassword(createSessionToken());
const LOGIN_FAILURE_LIMIT = 8;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const PUBLIC_DEMO_AUDIT_NOTE = "공개 데모에서 수행한 상태 변경";
const DEFAULT_PUBLIC_DEMO_MUTATION_LIMITS = {
  sessionLimit: 30,
  ipLimit: 120,
  windowMs: 10 * 60 * 1000,
};
const DEFAULT_PUBLIC_DEMO_LOGIN_RESET_LIMITS = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function createLoginFailureTracker() {
  const failures = new Map();

  function prune(now) {
    for (const [key, value] of failures) {
      if (value.expiresAt <= now) failures.delete(key);
    }
    while (failures.size >= 5_000) failures.delete(failures.keys().next().value);
  }

  return {
    assertAllowed(key) {
      const now = Date.now();
      const current = failures.get(key);
      if (!current || current.expiresAt <= now || current.count < LOGIN_FAILURE_LIMIT) return;

      const error = new WorkflowError(
        "LOGIN_RATE_LIMITED",
        "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        429,
      );
      error.retryAfter = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      throw error;
    },

    recordFailure(key) {
      const now = Date.now();
      prune(now);
      const current = failures.get(key);
      if (!current || current.expiresAt <= now) {
        failures.set(key, { count: 1, expiresAt: now + LOGIN_FAILURE_WINDOW_MS });
        return;
      }
      current.count += 1;
    },

    clear(key) {
      failures.delete(key);
    },
  };
}

function createFixedWindowTracker(limit, windowMs) {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error("Public demo rate limits must be positive integers.");
  }

  const entries = new Map();

  function currentEntry(key, now) {
    const current = entries.get(key);
    if (!current || current.expiresAt <= now) {
      if (current) entries.delete(key);
      return null;
    }
    return current;
  }

  function prune(now) {
    for (const [key, value] of entries) {
      if (value.expiresAt <= now) entries.delete(key);
    }
    while (entries.size >= 5_000) entries.delete(entries.keys().next().value);
  }

  return {
    retryAfterMs(key, now) {
      const current = currentEntry(key, now);
      return current && current.count >= limit ? current.expiresAt - now : 0;
    },

    record(key, now) {
      prune(now);
      const current = currentEntry(key, now);
      if (!current) {
        entries.set(key, { count: 1, expiresAt: now + windowMs });
        return;
      }
      current.count += 1;
    },
  };
}

function createPublicDemoMutationLimiter({ sessionLimit, ipLimit, windowMs }) {
  const sessions = createFixedWindowTracker(sessionLimit, windowMs);
  const addresses = createFixedWindowTracker(ipLimit, windowMs);

  return {
    consume(sessionKey, addressKey) {
      const now = Date.now();
      const retryAfterMs = Math.max(
        sessions.retryAfterMs(sessionKey, now),
        addresses.retryAfterMs(addressKey, now),
      );
      if (retryAfterMs > 0) {
        const error = new WorkflowError(
          "DEMO_MUTATION_RATE_LIMITED",
          "공개 데모 변경 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
          429,
        );
        error.retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
        throw error;
      }

      sessions.record(sessionKey, now);
      addresses.record(addressKey, now);
    },
  };
}

function consumeFixedWindow(tracker, key, code, message) {
  const now = Date.now();
  const retryAfterMs = tracker.retryAfterMs(key, now);
  if (retryAfterMs > 0) {
    const error = new WorkflowError(code, message, 429);
    error.retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw error;
  }
  tracker.record(key, now);
}

function setSecurityHeaders(request, response, next) {
  response.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; "));
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  if (request.path.startsWith("/api")) response.setHeader("Cache-Control", "no-store");
  next();
}

function requireTrustedMutation(request, _response, next) {
  if (request.get(MUTATION_HEADER) !== "1") {
    return next(
      new WorkflowError(
        "CSRF_REJECTED",
        "변경 요청을 확인할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
        403,
      ),
    );
  }

  const fetchSite = request.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return next(
      new WorkflowError(
        "CSRF_REJECTED",
        "다른 사이트에서 시작된 변경 요청은 허용되지 않습니다.",
        403,
      ),
    );
  }

  next();
}

function requireJson(request, _response, next) {
  if (!request.is("application/json")) {
    return next(new WorkflowError("JSON_REQUIRED", "JSON 형식의 요청이 필요합니다.", 415));
  }
  next();
}

function parseOrderFilters(query) {
  const rawQuery = query.q;
  const rawStatus = query.status;
  const rawExceptions = query.exceptions;

  if (rawQuery !== undefined && typeof rawQuery !== "string") {
    throw new WorkflowError("FILTER_INVALID", "검색 조건은 하나의 문자열이어야 합니다.");
  }
  if (rawStatus !== undefined && (typeof rawStatus !== "string" || !ORDER_STATUSES.includes(rawStatus))) {
    throw new WorkflowError("FILTER_INVALID", "지원하지 않는 주문 상태 필터입니다.");
  }
  if (
    rawExceptions !== undefined &&
    (typeof rawExceptions !== "string" || !["true", "false"].includes(rawExceptions))
  ) {
    throw new WorkflowError("FILTER_INVALID", "예외 필터는 true 또는 false여야 합니다.");
  }

  return {
    query: (rawQuery || "").trim().slice(0, 100),
    status: rawStatus || "",
    exceptionsOnly: rawExceptions === "true",
  };
}

function parseOrderId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) {
    throw new WorkflowError("ORDER_ID_INVALID", "주문 식별자 형식을 확인해 주세요.");
  }
  return value;
}

function readCookie(request, name) {
  const cookies = String(request.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return "";
  }
}

function sessionCookie(token, production) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${SESSION_SECONDS}`,
    production ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie(production) {
  return [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=0",
    production ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function publicUser(user, publicDemoMode) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant: user.tenant,
    publicDemoMode,
  };
}

export function createApp({
  store,
  production = process.env.NODE_ENV === "production",
  secureCookies = production && process.env.SESSION_COOKIE_SECURE !== "false",
  publicDemoMode = process.env.PUBLIC_DEMO_MODE === "true",
  publicDemoMutationLimits = DEFAULT_PUBLIC_DEMO_MUTATION_LIMITS,
  publicDemoLoginResetLimits = DEFAULT_PUBLIC_DEMO_LOGIN_RESET_LIMITS,
  staticDir,
}) {
  const app = express();
  const loginFailures = createLoginFailureTracker();
  const publicDemoMutations = createPublicDemoMutationLimiter(publicDemoMutationLimits);
  const publicDemoLoginResets = createFixedWindowTracker(
    publicDemoLoginResetLimits.limit,
    publicDemoLoginResetLimits.windowMs,
  );
  app.disable("x-powered-by");
  app.use(setSecurityHeaders);
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health/live", (_request, response) => {
    response.json({ ok: true, service: "orderops-api" });
  });

  const readiness = async (_request, response) => {
    try {
      await store.health();
      response.json({ ok: true, service: "orderops-api", database: "ready" });
    } catch {
      response.status(503).json({
        ok: false,
        service: "orderops-api",
        database: "unavailable",
      });
    }
  };

  app.get("/api/health", readiness);
  app.get("/api/health/ready", readiness);

  app.get("/api/auth/demo-accounts", async (_request, response, next) => {
    try {
      response.json({ accounts: await store.listDemoAccounts(), publicDemoMode });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", requireTrustedMutation, requireJson, async (request, response, next) => {
    try {
      const { tenantSlug, email, password } = request.body ?? {};
      if (
        typeof tenantSlug !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !tenantSlug ||
        !email ||
        !password
      ) {
        throw new WorkflowError("LOGIN_FIELDS_REQUIRED", "회사, 이메일, 비밀번호를 모두 입력해 주세요.");
      }
      const normalizedTenantSlug = tenantSlug.trim();
      const normalizedEmail = email.trim().toLowerCase();
      if (
        !/^[a-z0-9-]{1,64}$/.test(normalizedTenantSlug) ||
        !/^[^\s@]+@[^\s@]+$/.test(normalizedEmail) ||
        normalizedEmail.length > 200 ||
        password.length > 200
      ) {
        throw new WorkflowError("LOGIN_FIELDS_INVALID", "로그인 입력값의 형식을 확인해 주세요.");
      }

      const loginKey = `${request.socket.remoteAddress || "unknown"}:${normalizedTenantSlug}:${normalizedEmail}`;
      loginFailures.assertAllowed(loginKey);
      const loginUser = await store.findUserForLogin(normalizedTenantSlug, normalizedEmail);
      const passwordMatches = await verifyPassword(
        password,
        loginUser?.password_hash || (await DUMMY_PASSWORD_HASH),
      );
      if (!loginUser || !passwordMatches || (publicDemoMode && !loginUser.is_demo)) {
        loginFailures.recordFailure(loginKey);
        throw new WorkflowError("LOGIN_FAILED", "로그인 정보를 확인해 주세요.", 401);
      }
      loginFailures.clear(loginKey);
      if (publicDemoMode) {
        consumeFixedWindow(
          publicDemoLoginResets,
          loginKey,
          "DEMO_LOGIN_RATE_LIMITED",
          "공개 데모 초기화 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        );
        await store.resetDemoTenant(loginUser.tenant_id);
      }

      const previousToken = readCookie(request, SESSION_COOKIE);
      if (previousToken) await store.deleteSession(hashSessionToken(previousToken));
      const token = createSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
      await store.createSession(loginUser.id, loginUser.tenant_id, hashSessionToken(token), expiresAt);
      const user = {
        id: loginUser.id,
        name: loginUser.name,
        email: loginUser.email,
        role: loginUser.role,
        tenant: {
          id: loginUser.tenant_id,
          slug: loginUser.tenant_slug,
          name: loginUser.tenant_name,
        },
      };
      response.setHeader("Set-Cookie", sessionCookie(token, secureCookies));
      response.json({ user: publicUser(user, publicDemoMode), expiresAt });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", async (request, response, next) => {
    try {
      const token = readCookie(request, SESSION_COOKIE);
      if (!token) throw new WorkflowError("AUTH_REQUIRED", "로그인이 필요합니다.", 401);
      const tokenHash = hashSessionToken(token);
      const user = await store.findSession(tokenHash);
      if (!user) {
        response.setHeader("Set-Cookie", clearSessionCookie(secureCookies));
        throw new WorkflowError("SESSION_EXPIRED", "세션이 만료되었습니다. 다시 로그인해 주세요.", 401);
      }
      request.user = user;
      request.sessionTokenHash = tokenHash;
      next();
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", requireTrustedMutation, async (request, response, next) => {
    try {
      await store.deleteSession(request.sessionTokenHash);
      response.setHeader("Set-Cookie", clearSessionCookie(secureCookies));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", (request, response) => {
    response.json({ user: publicUser(request.user, publicDemoMode) });
  });

  function requirePublicDemoMutationBudget(request, _response, next) {
    if (!publicDemoMode) return next();
    try {
      publicDemoMutations.consume(
        request.sessionTokenHash,
        request.socket.remoteAddress || "unknown",
      );
      next();
    } catch (error) {
      next(error);
    }
  }

  app.get("/api/metrics", async (request, response, next) => {
    try {
      response.json({ metrics: await store.getMetrics(request.user.tenant.id) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/orders", async (request, response, next) => {
    try {
      const orders = await store.listOrders(request.user.tenant.id, parseOrderFilters(request.query));
      response.json({
        orders: orders.map((order) => ({
          ...order,
          allowedTransitions: allowedTransitions(request.user.role, order.status),
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/orders/:orderId/audit", async (request, response, next) => {
    try {
      const orderId = parseOrderId(request.params.orderId);
      const audit = await store.getAudit(request.user.tenant.id, orderId);
      response.json({ audit });
    } catch (error) {
      next(error);
    }
  });

  app.patch(
    "/api/orders/:orderId/status",
    requireTrustedMutation,
    requireJson,
    requirePublicDemoMutationBudget,
    async (request, response, next) => {
      try {
        const { status, expectedVersion, note } = request.body ?? {};
        if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
          throw new WorkflowError("VERSION_REQUIRED", "주문의 현재 버전이 필요합니다.");
        }
        if (typeof status !== "string") {
          throw new WorkflowError("INVALID_STATUS", "지원하지 않는 주문 상태입니다.");
        }
        if (note !== undefined && typeof note !== "string") {
          throw new WorkflowError("NOTE_INVALID", "변경 사유는 문자열이어야 합니다.");
        }
        if (typeof note === "string" && note.length > 200) {
          throw new WorkflowError("NOTE_TOO_LONG", "변경 사유는 200자 이내로 입력해 주세요.");
        }

        const result = await store.transitionOrder({
          tenantId: request.user.tenant.id,
          orderId: parseOrderId(request.params.orderId),
          actor: request.user,
          toStatus: status,
          expectedVersion,
          note: publicDemoMode
            ? PUBLIC_DEMO_AUDIT_NOTE
            : typeof note === "string"
              ? note.trim()
              : "",
        });
        response.json({
          order: {
            ...result.order,
            allowedTransitions: allowedTransitions(request.user.role, result.order.status),
          },
          audit: result.audit,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  if (staticDir) {
    app.use(express.static(staticDir, { dotfiles: "ignore", index: false }));
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api")) return next();
      response.sendFile("index.html", { root: staticDir, dotfiles: "deny" }, (error) => {
        if (error) next(error);
      });
    });
  }

  app.use((request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: request.path.startsWith("/api") ? "API 경로를 찾을 수 없습니다." : "페이지를 찾을 수 없습니다.",
      },
    });
  });

  app.use((error, _request, response, _next) => {
    const malformedJson = error?.type === "entity.parse.failed";
    const payloadTooLarge = error?.type === "entity.too.large";
    const status = error instanceof WorkflowError ? error.status : malformedJson ? 400 : payloadTooLarge ? 413 : 500;
    const code = error instanceof WorkflowError
      ? error.code
      : malformedJson
        ? "INVALID_JSON"
        : payloadTooLarge
          ? "PAYLOAD_TOO_LARGE"
          : "INTERNAL_ERROR";
    if (error?.retryAfter) response.setHeader("Retry-After", String(error.retryAfter));
    if (status >= 500) console.error(error);
    response.status(status).json({
      error: {
        code,
        message: status >= 500
          ? "서버에서 요청을 처리하지 못했습니다."
          : malformedJson
            ? "JSON 요청 형식을 확인해 주세요."
            : payloadTooLarge
              ? "요청 본문이 너무 큽니다."
              : error.message,
      },
    });
  });

  return app;
}
