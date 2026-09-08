import assert from "node:assert/strict";
import test from "node:test";
import { deliveryStatus, signPayload } from "./webhook-policy.ts";

test("webhook payloads are signed with hmac-sha256", () => {
  const signature = signPayload("secret", "{}");
  assert.equal(signature.length, 64);
  assert.equal(signature, signPayload("secret", "{}"));
  assert.notEqual(signature, signPayload("other", "{}"));
});

test("2xx marks delivered", () => {
  const result = deliveryStatus(200, 0);
  assert.equal(result.status, "DELIVERED");
  assert.equal(result.nextRetry, null);
});

test("failures retry with capped exponential backoff then give up", () => {
  const first = deliveryStatus(500, 1);
  assert.equal(first.status, "PENDING");
  assert.ok(first.nextRetry !== null);

  const late = deliveryStatus(500, 8);
  assert.equal(late.status, "FAILED");
  assert.equal(late.nextRetry, null);
});
