import assert from "node:assert/strict";
import test from "node:test";
import {
  PermanentPaymentError,
  isRetryable,
  retryDelay,
  runStage,
} from "./core.ts";
import { shouldReclaimAfterRestart } from "./recovery.ts";

test("retry policy caps at five minutes", () => {
  assert.equal(retryDelay(0), 15_000);
  assert.equal(retryDelay(99), 300_000);
  assert.equal(isRetryable(new Error("HTTP 429")), true);
  assert.equal(isRetryable(new Error("SOURCE_TX_PENDING")), true);
  // Unknown wording (e.g. new proof-builder messages) retries; only the
  // deterministic validation errors are terminal.
  assert.equal(isRetryable(new Error("unknown provider wording")), true);
  assert.equal(
    isRetryable(new PermanentPaymentError("PAYMENT_TRANSFER_NOT_FOUND")),
    false,
  );
});
test("permanent failures are not retried", async () => {
  const job = { status: "RECEIVED" as const, attemptCount: 0 };
  const result = await runStage(job, async () => {
    throw new PermanentPaymentError("PAYMENT_TRANSFER_NOT_FOUND");
  });
  assert.equal(result.status, "PERMANENT_REJECTION");
});
test("pending source transactions are retried", async () => {
  const job = { status: "RECEIVED" as const, attemptCount: 0 };
  const result = await runStage(job, async () => {
    throw new Error("SOURCE_TX_PENDING");
  });
  assert.equal(result.status, "RETRYABLE_ERROR");
});

test("a stale intermediate job is reclaimed after a worker restart", () => {
  const now = new Date("2026-08-26T00:02:00.000Z");
  assert.equal(
    shouldReclaimAfterRestart(
      "WAITING_ATTESTATION",
      new Date("2026-08-26T00:00:59.000Z"),
      now,
    ),
    true,
  );
  assert.equal(
    shouldReclaimAfterRestart(
      "WAITING_ATTESTATION",
      new Date("2026-08-26T00:01:30.000Z"),
      now,
    ),
    false,
  );
  assert.equal(
    shouldReclaimAfterRestart(
      "PERMANENT_REJECTION",
      new Date("2026-08-25T00:00:00.000Z"),
      now,
    ),
    false,
  );
});
