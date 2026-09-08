import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../../../", import.meta.url);

test("recovery page surfaces proof query id and explorer evidence", async () => {
  const component = await readFile(
    new URL("src/components/recovery-status.tsx", root),
    "utf8",
  );

  assert.match(component, /Proof query ID/);
  assert.match(component, /creditcoin-testnet\.blockscout\.com\/queryId\//);
});

test("settlement api exposes the proof query id", async () => {
  const route = await readFile(
    new URL("src/app/api/v1/sales/[saleId]/settlement/route.ts", root),
    "utf8",
  );

  assert.match(route, /queryId/);
});
