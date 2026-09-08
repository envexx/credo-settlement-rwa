import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("webhook route mirrors payment route guards", async () => {
  const route = await read("src/app/api/v1/sales/[saleId]/webhook/route.ts");

  assert.match(route, /protectRequest\(request/);
  assert.match(route, /requireWallet/);
  assert.match(route, /BUYER_WALLET_MISMATCH/);
  assert.match(route, /startsWith\("https:\/\/"\)/);
});

test("worker dispatcher is signature-based with bounded retries", async () => {
  const dispatcher = await read("worker/webhook.ts");
  const policy = await read("worker/webhook-policy.ts");

  assert.match(dispatcher, /x-credo-signature/);
  assert.match(dispatcher, /AbortSignal\.timeout/);
  assert.match(policy, /attempt >= 8/);
});

test("webhook migration creates durable delivery table", async () => {
  const migration = await read("db/migrations/0002_webhooks.sql");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS webhook_endpoints/);
  assert.match(migration, /next_retry_at/);
});
