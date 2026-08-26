import assert from "node:assert/strict";
import test from "node:test";
import { addPayment, addSale } from "./store.ts";

const base = {
  seller: "0x1111111111111111111111111111111111111111",
  buyer: "0x2222222222222222222222222222222222222222",
  assetContract: "0x3333333333333333333333333333333333333333",
  tokenId: "1",
  assetAmount: "1",
  paymentChainKey: 1,
  paymentChainId: 11155111,
  paymentToken: "0x4444444444444444444444444444444444444444",
  paymentRecipient: "0x1111111111111111111111111111111111111111",
  paymentAmount: "5000000",
  sourceStartBlock: "1",
  sourceEndBlock: "2",
  status: "OPEN" as const,
};

test("a source transaction cannot be assigned to two sales", () => {
  addSale({ ...base, saleId: "0x" + "a".repeat(64) });
  addSale({ ...base, saleId: "0x" + "b".repeat(64) });
  addPayment("0x" + "a".repeat(64), "0x" + "c".repeat(64));
  assert.throws(
    () => addPayment("0x" + "b".repeat(64), "0x" + "c".repeat(64)),
    /already assigned/,
  );
});
