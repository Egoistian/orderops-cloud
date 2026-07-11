import type { AuditEvent, DemoAccount, Metrics, Order, OrderStatus, User } from "./types";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = String(options.method || "GET").toUpperCase();
  const hasBody = options.body !== undefined;
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" && method !== "HEAD" ? { "X-OrderOps-Request": "1" } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // A proxy or network edge may return a non-JSON error page.
    }
    throw new ApiError(
      response.status,
      body.error?.code || "REQUEST_FAILED",
      body.error?.message || "요청을 처리하지 못했습니다.",
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await request<{ user: User }>("/api/auth/me");
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const response = await request<{ accounts: DemoAccount[] }>("/api/auth/demo-accounts");
  return response.accounts;
}

export async function login(input: {
  tenantSlug: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  return response.user;
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

export async function getMetrics(signal?: AbortSignal): Promise<Metrics> {
  const response = await request<{ metrics: Metrics }>("/api/metrics", { signal });
  return response.metrics;
}

export async function getOrders(
  filters: { query: string; status: OrderStatus | ""; exceptionsOnly: boolean },
  signal?: AbortSignal,
): Promise<Order[]> {
  const search = new URLSearchParams();
  if (filters.query) search.set("q", filters.query);
  if (filters.status) search.set("status", filters.status);
  if (filters.exceptionsOnly) search.set("exceptions", "true");
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await request<{ orders: Order[] }>(`/api/orders${suffix}`, { signal });
  return response.orders;
}

export async function getOrderAudit(orderId: string, signal?: AbortSignal): Promise<AuditEvent[]> {
  const response = await request<{ audit: AuditEvent[] }>(
    `/api/orders/${encodeURIComponent(orderId)}/audit`,
    { signal },
  );
  return response.audit;
}

export async function transitionOrder(input: {
  orderId: string;
  status: OrderStatus;
  expectedVersion: number;
  note: string;
}): Promise<{ order: Order; audit: AuditEvent }> {
  return request<{ order: Order; audit: AuditEvent }>(
    `/api/orders/${encodeURIComponent(input.orderId)}/status`,
    {
      method: "PATCH",
      body: {
        status: input.status,
        expectedVersion: input.expectedVersion,
        note: input.note,
      },
    },
  );
}
