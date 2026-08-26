import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceSale,
  demoProof,
  demoSale,
  settle,
  verifyPayment,
} from "./settlement.ts";

const openSale = () => advanceSale(demoSale(), "CREATE");
const paidSale = () => advanceSale(openSale(), "PAY");
const readySale = () => advanceSale(advanceSale(paidSale(), "ATTEST"), "PROVE");

test("demo lifecycle starts as a draft and escrows before payment", () => {
  const draft = demoSale();
  assert.equal(draft.status, "DRAFT");
  const open = advanceSale(draft, "CREATE");
  assert.equal(open.status, "OPEN");
});

test("demo lifecycle records evidence at the stage that produced it", () => {
  const paid = paidSale();
  assert.match(paid.sourceTxHash ?? "", /^0x[a-f0-9]{64}$/);
  assert.equal(paid.sourceBlock, 11_566_178);

  const ready = advanceSale(advanceSale(paid, "ATTEST"), "PROVE");
  assert.match(ready.queryId ?? "", /^0x[a-f0-9]{64}$/);

  const settled = settle(ready, demoProof(ready), new Set());
  assert.match(settled.creditcoinTxHash ?? "", /^0x[a-f0-9]{64}$/);
});

test("valid proof settles once", () => {
  const consumed = new Set<string>();
  const sale = readySale();
  assert.equal(settle(sale, demoProof(sale), consumed).status, "SETTLED");
  assert.throws(
    () => settle(sale, demoProof(sale), consumed),
    /already consumed/,
  );
});

for (const [name, change, message] of [
  ["failed receipt", { receiptSucceeded: false }, /failed/],
  ["wrong chain", { chainKey: 99 }, /chain/],
  [
    "wrong token",
    { token: "0x0000000000000000000000000000000000000000" },
    /token/,
  ],
  [
    "wrong payer",
    { from: "0x0000000000000000000000000000000000000000" },
    /payer/,
  ],
  [
    "wrong recipient",
    { to: "0x0000000000000000000000000000000000000000" },
    /recipient/,
  ],
  ["wrong amount", { amount: 1n }, /amount/],
  ["wrong block", { sourceBlock: 1 }, /block window/],
] as const) {
  test(`rejects ${name}`, () => {
    const sale = readySale();
    assert.throws(
      () => verifyPayment(sale, { ...demoProof(sale), ...change }, new Set()),
      message,
    );
  });
}

test("enforces state-machine order", () => {
  assert.throws(() => advanceSale(demoSale(), "PROVE"), /Cannot prove/);
});
