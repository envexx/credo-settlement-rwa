import { requireWallet } from "@/lib/auth";
import { ApiError, apiError } from "@/lib/http";
import { paymentRequest } from "@/lib/schemas";
import { findSale, persistPayment } from "@/lib/store";
import { protectRequest } from "@/lib/security";
import { NextResponse } from "next/server";
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
        "Only the bound buyer may register payment",
      );
    if (sale.status !== "OPEN")
      throw new ApiError(410, "SALE_NOT_PAYABLE", "Sale is no longer payable");
    const { sourceTxHash } = paymentRequest.parse(await request.json());
    const payment = await persistPayment(saleId, sourceTxHash);
    return NextResponse.json(
      {
        paymentId: payment.id,
        status: payment.status,
        sourceTxHash: payment.sourceTxHash,
      },
      { status: 202 },
    );
  } catch (error) {
    return apiError(error);
  }
}
