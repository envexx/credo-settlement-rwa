import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = new URL("./route.ts", import.meta.url);

test("live-sale route is authenticated and owns fixed terms server-side", async () => {
  const source = await readFile(route, "utf8");

  assert.match(source, /requireWallet\(\)/);
  assert.match(source, /protectRequest\(request\)/);
  assert.match(source, /withDemoSellerLock/);
  assert.match(source, /buildDemoSaleTerms/);
  assert.doesNotMatch(source, /await request\.json\(\)/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_DEMO_SELLER/);
});
