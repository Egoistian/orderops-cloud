import test from "node:test";
import assert from "node:assert/strict";
import {
  exportCsv,
  loadMessyCsv,
  parseCsv,
  processOrders,
  seedOrders,
  summarize,
} from "./orderEngine.js";

test("normalizes customer fields and classifies metro cold orders", () => {
  const [first] = processOrders(seedOrders);

  assert.equal(first.normalized.customerName, "김*현");
  assert.equal(first.normalized.maskedPhone, "010-****-1245");
  assert.equal(first.normalized.region, "서울");
  assert.equal(first.lane, "수도권 당일");
  assert.ok(first.tags.includes("냉장"));
  assert.equal(first.state, "ready");
});

test("flags invalid phone and missing address without crashing", () => {
  const processed = processOrders(seedOrders);
  const invalidPhone = processed.find((order) => order.orderId === "YJ250602-0013");
  const missingAddress = processed.find((order) => order.orderId === "YJ250602-0014");

  assert.ok(invalidPhone.exceptions.includes("연락처확인"));
  assert.equal(invalidPhone.state, "blocked");
  assert.ok(missingAddress.exceptions.includes("주소확인"));
  assert.equal(missingAddress.lane, "주소확인");
});

test("imports messy CSV and preserves classified fields in export", () => {
  const imported = parseCsv(loadMessyCsv());
  const processed = processOrders(imported);
  const exported = exportCsv(processed);
  const reimported = parseCsv(exported);

  assert.equal(imported.length, 4);
  assert.equal(processed.length, 4);
  assert.ok(processed.some((order) => order.lane === "냉장"));
  assert.ok(processed.some((order) => order.exceptions.includes("주소확인")));
  assert.equal(reimported.length, 4);
});

test("summarizes bucket counts and exception rate", () => {
  const processed = processOrders(seedOrders);
  const summary = summarize(processed);

  assert.equal(summary.total, seedOrders.length);
  assert.ok(summary.classifiedCount > 0);
  assert.ok(summary.exceptionCount > 0);
  assert.ok(summary.buckets.some((bucket) => bucket.lane === "주소확인" && bucket.count > 0));
});
