export type UserRole = "admin" | "operator" | "viewer";

export type OrderStatus = "received" | "normalized" | "exception" | "ready" | "shipped";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant: Tenant;
  publicDemoMode: boolean;
};

export type DemoAccount = {
  email: string;
  name: string;
  role: UserRole;
  tenantSlug: string;
  tenantName: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  orderedAt: string;
  customerName: string;
  maskedPhone: string;
  region: string;
  productName: string;
  quantity: number;
  lane: string;
  priority: "high" | "normal" | "low" | "review";
  status: OrderStatus;
  exceptions: string[];
  normalizationNotes: string[];
  warehouse: string;
  shippingLine: string;
  totalAmount: number;
  version: number;
  updatedAt: string;
  allowedTransitions: OrderStatus[];
};

export type Metrics = {
  total: number;
  exceptions: number;
  ready: number;
  shipped: number;
  totalAmount: number;
  lastUpdatedAt: string | null;
  statusCounts: Partial<Record<OrderStatus, number>>;
};

export type AuditEvent = {
  id: string;
  action: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  actorName: string;
  actorRole: UserRole;
  createdAt: string;
};
