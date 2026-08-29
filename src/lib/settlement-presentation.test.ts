import assert from "node:assert/strict";
import test from "node:test";
import { settlementPresentation } from "./settlement-presentation";

test("explains an open sale before payment", () => {
  assert.deepEqual(
    settlementPresentation({ saleStatus: "OPEN", proofStatus: null }),
    {
      tone: "waiting",
      title: "Ready for payment",
      body: "Pay the exact test USDC amount shown below from the connected buyer wallet.",
      nextAction: "Complete the Sepolia payment.",
      terminal: false,
    },
  );
});

test("distinguishes proof waiting, retry, and rejection", () => {
  assert.equal(
    settlementPresentation({
      saleStatus: "OPEN",
      proofStatus: "WAITING_ATTESTATION",
    }).tone,
    "processing",
  );
  assert.equal(
    settlementPresentation({
      saleStatus: "OPEN",
      proofStatus: "RETRYABLE_ERROR",
    }).terminal,
    false,
  );
  assert.equal(
    settlementPresentation({
      saleStatus: "OPEN",
      proofStatus: "PERMANENT_REJECTION",
    }).tone,
    "error",
  );
});

test("marks settlement as terminal", () => {
  const result = settlementPresentation({
    saleStatus: "SETTLED",
    proofStatus: "SETTLED",
  });
  assert.equal(result.terminal, true);
  assert.equal(
    result.nextAction,
    "Inspect the public settlement evidence.",
  );
});
