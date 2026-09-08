import { readFile } from "node:fs/promises";
import postgres from "postgres";
import {
  deliveryStatus,
  signPayload,
  type WebhookDelivery,
} from "./webhook-policy.ts";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

/** Queue a settlement webhook; URL + secret come from the integrator request. */
export async function enqueueWebhook(
  saleId: string,
  url: string,
  secret: string,
) {
  const id = crypto.randomUUID();
  await sql`INSERT INTO webhook_endpoints(id,sale_id,url,secret) VALUES(${id},${saleId},${url},${secret})`;
  return id;
}

/** Pending or retry-due deliveries, bounded per tick. */
export async function dueWebhooks(limit = 5) {
  const rows = await sql`
    SELECT id, sale_id AS "saleId", url, secret, attempts
    FROM webhook_endpoints
    WHERE status = 'PENDING' AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at
    LIMIT ${limit}`;
  return rows as unknown as {
    id: string;
    saleId: string;
    url: string;
    secret: string;
    attempts: number;
  }[];
}

export async function deliverWebhook(row: {
  id: string;
  saleId: string;
  url: string;
  secret: string;
  attempts: number;
}) {
  const { sale, payment, job } = await settlementSnapshot(row.saleId);
  const body = JSON.stringify({
    saleId: row.saleId,
    saleStatus: sale?.status ?? "UNKNOWN",
    paymentStatus: payment?.status ?? null,
    creditcoinTxHash: job?.creditcoin_tx_hash ?? null,
    queryId: job?.query_id ?? null,
  } satisfies WebhookDelivery & { paymentStatus: string | null });
  const signature = signPayload(row.secret, body);
  let response: Response;
  try {
    response = await fetch(row.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-credo-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    await recordFailure(row, error instanceof Error ? error.message : "fetch");
    return false;
  }
  if (response.ok) {
    await sql`UPDATE webhook_endpoints SET status='DELIVERED', delivered_at=now(), attempts=attempts+1, last_error=NULL WHERE id=${row.id}`;
    return true;
  }
  await recordFailure(row, `HTTP ${response.status}`);
  return false;
}

async function recordFailure(
  row: { id: string; attempts: number },
  error: string,
) {
  const { status, nextRetry } = deliveryStatus(500, row.attempts + 1);
  await sql`UPDATE webhook_endpoints SET status=${status}, attempts=attempts+1, next_retry_at=${nextRetry}, last_error=${error.slice(0, 500)} WHERE id=${row.id}`;
}

async function settlementSnapshot(saleId: string) {
  const sales =
    await sql`SELECT status FROM sales_index WHERE sale_id=${saleId}`;
  const payments =
    await sql`SELECT status FROM payment_attempts WHERE sale_id=${saleId} ORDER BY detected_at DESC LIMIT 1`;
  const jobs =
    await sql`SELECT j.creditcoin_tx_hash, j.query_id FROM proof_jobs j JOIN payment_attempts p ON p.id=j.payment_attempt_id WHERE p.sale_id=${saleId}`;
  return { sale: sales[0], payment: payments[0], job: jobs[0] };
}

const invokedDirectly = process.argv[1]?.includes("webhook");
if (invokedDirectly) {
  let delivered = 0;
  for (const row of await dueWebhooks()) {
    if (await deliverWebhook(row)) delivered += 1;
  }
  await sql.end();
  console.log(JSON.stringify({ service: "webhook-dispatcher", delivered }));
  void readFile;
}
