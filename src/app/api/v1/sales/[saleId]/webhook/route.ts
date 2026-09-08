import { requireWallet } from "@/lib/auth";
import { ApiError, apiError } from "@/lib/http";
import { findSale } from "@/lib/store";
import { enqueueWebhook } from "@/lib/webhook-store";
import { protectRequest } from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const webhookRequest = z
  .object({
    url: z.string().url().startsWith("https://").max(500),
    secret: z.string().min(16).max(64),
  })
  .strict();

/**
 * Register an integrator webhook for a sale. Only the bound buyer (the party
 * with settlement visibility) may attach an endpoint; deliveries are signed
 * with the provided secret (HMAC-SHA256) by worker/webhook.ts.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ saleId: string }> },
) {
  try {
    protectRequest(request);
    const wallet = await requireWallet();
    const { saleId } = await context.params;
    const sale = await findSale(saleId);
    if (!sale) throw new ApiError(404, "SALE_NOT_FOUND", "Sale was not found");
    if (wallet !== sale.buyer.toLowerCase())
      throw new ApiError(
        403,
        "BUYER_WALLET_MISMATCH",
        "Only the bound buyer may register webhooks",
      );
    const { url, secret } = webhookRequest.parse(await request.json());
    const result = await enqueueWebhook(saleId, url, secret);
    if ("error" in result)
      throw new ApiError(
        503,
        "DB_UNAVAILABLE",
        "Webhook registration is temporarily unavailable",
      );
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
