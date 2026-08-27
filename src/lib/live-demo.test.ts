import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_PRICE_RAW,
  DEMO_WINDOW_BLOCKS,
  assertReservationAllowed,
  buildDemoSaleTerms,
  isReclaimable,
} from "./live-demo";
import { ApiError } from "./http";

const buyer = "0x2222222222222222222222222222222222222222";
const seller = "0x1111111111111111111111111111111111111111";

function hasCode(code: string) {
  return (error: unknown) => error instanceof ApiError && error.code === code;
}

test("builds fixed terms from the authenticated buyer only", () => {
  const terms = buildDemoSaleTerms({
    buyer,
    seller,
    assetContract: "0x3333333333333333333333333333333333333333",
    paymentToken: "0x4444444444444444444444444444444444444444",
    latestSourceBlock: 100n,
  });

  assert.equal(terms.buyer, buyer);
  assert.equal(terms.assetAmount, 1n);
  assert.equal(terms.paymentAmount, DEMO_PRICE_RAW);
  assert.equal(terms.sourceStartBlock, 101n);
  assert.equal(terms.sourceEndBlock, 101n + DEMO_WINDOW_BLOCKS);
});

test("reservation policy rejects an open buyer sale", () => {
  assert.throws(
    () =>
      assertReservationAllowed({
        buyerHasOpenSale: true,
        openCount: 0,
        inventory: 1n,
      }),
    hasCode("OPEN_DEMO_SALE_EXISTS"),
  );
});

test("reservation policy rejects the active cap", () => {
  assert.throws(
    () =>
      assertReservationAllowed({
        buyerHasOpenSale: false,
        openCount: 5,
        inventory: 1n,
      }),
    hasCode("DEMO_CAP_REACHED"),
  );
});

test("reservation policy rejects an empty inventory", () => {
  assert.throws(
    () =>
      assertReservationAllowed({
        buyerHasOpenSale: false,
        openCount: 0,
        inventory: 0n,
      }),
    hasCode("DEMO_INVENTORY_EMPTY"),
  );
});

test("reclaim eligibility is strictly time based", () => {
  assert.equal(isReclaimable(1_000n, 999n), false);
  assert.equal(isReclaimable(1_000n, 1_000n), true);
});
