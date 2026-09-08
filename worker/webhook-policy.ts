import { createHmac } from "node:crypto";

export type WebhookDelivery = {
  saleId: string;
  saleStatus: string;
  creditcoinTxHash: string | null;
  queryId: string | null;
};

export function signPayload(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function deliveryStatus(status: number, attempt: number) {
  if (status >= 200 && status < 300)
    return { status: "DELIVERED" as const, nextRetry: null };
  const giveUp = attempt >= 8;
  const delayMs = Math.min(60_000 * 2 ** attempt, 3_600_000);
  return {
    status: giveUp ? ("FAILED" as const) : ("PENDING" as const),
    nextRetry: giveUp ? null : new Date(Date.now() + delayMs),
  };
}
