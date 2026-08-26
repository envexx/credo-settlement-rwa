import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);

test("developer docs match the executable API settlement flow", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /\/api\/v1\/sales\/index/);
  assert.doesNotMatch(page, /fetch\("\/api\/v1\/sales",/);
  assert.match(page, /\/api\/v1\/sales\/:saleId\/settlement/);
  assert.doesNotMatch(page, /SETTLED or FAILED/);
  assert.match(page, /RETRYABLE_ERROR/);
  assert.match(page, /PERMANENT_REJECTION/);
});

test("developer docs expose contract-accurate ABI signatures", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(
    page,
    /function createSale\(address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock\)/,
  );
  assert.match(
    page,
    /event SaleSettled\(bytes32 indexed saleId,address indexed buyer,address indexed seller,bytes32 queryId,uint64 sourceBlock\)/,
  );
  assert.match(page, /TestRWA ABI/);
});

test("developer docs state the prerequisites that otherwise block integration", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Authenticate the buyer wallet/);
  assert.match(page, /0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238/);
  assert.match(page, /operator-managed allowlist/i);
  assert.match(page, /chain key/i);
  assert.match(page, /7,200 blocks/);
});
