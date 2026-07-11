import test from "node:test";
import assert from "node:assert/strict";
import { allowedTransitions, assertTransitionAllowed, WorkflowError } from "./workflow.mjs";

test("운영 담당자는 정상 순방향 상태만 변경할 수 있다", () => {
  assert.deepEqual(allowedTransitions("operator", "received"), ["normalized"]);
  assert.deepEqual(allowedTransitions("operator", "ready"), ["shipped"]);
  assert.doesNotThrow(() => assertTransitionAllowed("operator", "ready", "shipped"));
});

test("열람 전용 역할은 주문 상태를 바꿀 수 없다", () => {
  assert.deepEqual(allowedTransitions("viewer", "ready"), []);
  assert.throws(
    () => assertTransitionAllowed("viewer", "ready", "shipped"),
    (error) => error instanceof WorkflowError && error.code === "TRANSITION_FORBIDDEN" && error.status === 403,
  );
});

test("관리자는 정의된 예외 전이를 수행할 수 있다", () => {
  assert.deepEqual(allowedTransitions("admin", "ready"), ["shipped", "exception"]);
});
