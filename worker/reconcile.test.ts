import assert from "node:assert/strict";
import test from "node:test";
import { Interface } from "ethers";
import { acceptedQueryId, isAlreadyProcessedError } from "./reconcile.ts";

test("classifies duplicate proof submissions as already processed", () => {
  assert.ok(
    isAlreadyProcessedError(
      new Error("execution reverted: QueryAlreadyProcessed"),
    ),
  );
  assert.ok(!isAlreadyProcessedError(new Error("network timeout")));
  assert.ok(!isAlreadyProcessedError("execution reverted: SaleNotOpen"));
});

test("reads the accepted query id from a settlement receipt", () => {
  const iface = new Interface([
    "event PaymentProofAccepted(bytes32 indexed saleId,bytes32 indexed queryId,uint64 chainKey,uint64 sourceBlock)",
  ]);
  const event = iface.getEvent("PaymentProofAccepted");
  assert.ok(event);
  const encoded = iface.encodeEventLog(event, [
    "0x" + "ab".repeat(32),
    "0x" + "cd".repeat(32),
    1n,
    11576320n,
  ]);
  const receipt = {
    logs: [{ topics: encoded.topics, data: encoded.data }],
  } as unknown as Parameters<typeof acceptedQueryId>[0];
  assert.equal(acceptedQueryId(receipt), "0x" + "cd".repeat(32));
  assert.equal(acceptedQueryId(null), undefined);
  assert.equal(acceptedQueryId({ logs: [] } as never), undefined);
});
