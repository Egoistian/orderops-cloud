export const ORDER_STATUSES = ["received", "normalized", "exception", "ready", "shipped"];

const transitions = {
  received: ["normalized", "exception"],
  normalized: ["ready", "exception"],
  exception: ["ready"],
  ready: ["shipped", "exception"],
  shipped: [],
};

const operatorTransitions = new Set([
  "received:normalized",
  "normalized:ready",
  "normalized:exception",
  "exception:ready",
  "ready:shipped",
]);

export class WorkflowError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
    this.status = status;
  }
}

export function allowedTransitions(role, status) {
  const possible = transitions[status] ?? [];
  if (role === "admin") return possible;
  if (role === "operator") {
    return possible.filter((nextStatus) => operatorTransitions.has(`${status}:${nextStatus}`));
  }
  return [];
}

export function assertTransitionAllowed(role, fromStatus, toStatus) {
  if (!ORDER_STATUSES.includes(toStatus)) {
    throw new WorkflowError("INVALID_STATUS", "지원하지 않는 주문 상태입니다.");
  }

  if (!allowedTransitions(role, fromStatus).includes(toStatus)) {
    throw new WorkflowError(
      "TRANSITION_FORBIDDEN",
      "현재 역할 또는 주문 상태에서는 이 작업을 수행할 수 없습니다.",
      403,
    );
  }
}
