import assert from "node:assert/strict";
import test from "node:test";
import { CredoApiError, CredoClient } from "./client.ts";

function clientWith(
  handler: (path: string, init: RequestInit) => Response | Promise<Response>,
) {
  const calls: Array<{ path: string; init: RequestInit }> = [];
  const client = new CredoClient({
    baseUrl: "https://credo.example",
    fetch: (async (path: string | URL, init: RequestInit = {}) => {
      calls.push({ path: String(path), init });
      return handler(String(path), init);
    }) as typeof fetch,
  });
  return { client, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("sdk wraps the documented settlement flow", async () => {
  const { client, calls } = clientWith((path, init) => {
    if (path.endsWith("/api/v1/sales/0xabc/settlement"))
      return json({
        saleId: "0xabc",
        saleStatus: "SETTLED",
        payment: { status: "SETTLED", sourceTxHash: "0xpay" },
        proof: { status: "SETTLED", queryId: "0xq" },
        settlement: {
          creditcoinTxHash: "0xcc",
          assetRecipient: "0xbuyer",
          tokenId: "1001",
        },
      });
    return json({ error: { code: "NOT_FOUND", message: "no" } }, 404);
  });

  const snapshot = await client.settlement("0xabc");
  assert.equal(snapshot.saleStatus, "SETTLED");
  assert.equal(snapshot.settlement?.creditcoinTxHash, "0xcc");
  assert.equal(
    calls[0]?.path,
    "https://credo.example/api/v1/sales/0xabc/settlement",
  );
});

test("sdk surfaces typed api errors", async () => {
  const { client } = clientWith(() =>
    json(
      {
        error: {
          code: "PAYMENT_ALREADY_IN_PROGRESS",
          message: "This sale already has an active payment attempt",
        },
      },
      409,
    ),
  );
  await assert.rejects(
    client.registerPayment("0xabc", "0xhash"),
    (error: unknown) =>
      error instanceof CredoApiError &&
      error.status === 409 &&
      error.code === "PAYMENT_ALREADY_IN_PROGRESS",
  );
});

test("waitForSettlement stops when the sale resolves", async () => {
  let polls = 0;
  const { client } = clientWith((path) => {
    polls += 1;
    return json({
      saleId: "0xabc",
      saleStatus: polls >= 2 ? "SETTLED" : "OPEN",
      payment: null,
      proof: null,
      settlement: null,
    });
  });
  const snapshot = await client.waitForSettlement("0xabc", {
    intervalMs: 1,
    timeoutMs: 5_000,
  });
  assert.equal(snapshot.saleStatus, "SETTLED");
  assert.ok(polls >= 2);
});
