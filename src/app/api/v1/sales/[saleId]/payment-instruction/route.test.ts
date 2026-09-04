import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = new URL("./route.ts", import.meta.url);

test("payment instruction is bound to the authenticated buyer", async () => {
  const source = await readFile(route, "utf8");

  assert.match(source, /requireWallet\(\)/);
  assert.match(source, /wallet !== sale\.buyer\.toLowerCase\(\)/);
  assert.match(source, /BUYER_WALLET_MISMATCH/);
});
