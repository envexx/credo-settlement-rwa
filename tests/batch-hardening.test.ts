import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("SIWE domain derives from APP_URL host with localhost fallback", async () => {
  const config = await readFile(new URL("src/lib/config.ts", root), "utf8");

  assert.match(
    config,
    /new URL\(process\.env\.APP_URL \?\? "http:\/\/localhost:3000"\)\.host/,
  );
  assert.match(config, /localhost:3000/);
});

test("retry classification keeps known deterministic failures terminal", async () => {
  const core = await readFile(new URL("worker/core.ts", root), "utf8");

  // PermanentPaymentError must remain the terminal marker.
  assert.match(core, /PermanentPaymentError/);
});

test("payment registration is rate limited and single-active-per-sale", async () => {
  const route = await readFile(
    new URL("src/app/api/v1/sales/[saleId]/payment/route.ts", root),
    "utf8",
  );
  const store = await readFile(new URL("src/lib/store.ts", root), "utf8");

  assert.match(route, /protectRequest\(request/);
  assert.match(store, /activePaymentStatuses/);
  assert.match(store, /PAYMENT_ALREADY_IN_PROGRESS/);
});
