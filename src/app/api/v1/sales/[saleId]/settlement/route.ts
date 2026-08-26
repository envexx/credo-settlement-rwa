import { ApiError, apiError } from "@/lib/http";
import { settlementForSale } from "@/lib/store";
import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  context: { params: Promise<{ saleId: string }> },
) {
  try {
    const { saleId } = await context.params;
    const { sale, payment, job } = await settlementForSale(saleId);
    if (!sale) throw new ApiError(404, "SALE_NOT_FOUND", "Sale was not found");
    return NextResponse.json({
      saleId,
      saleStatus: sale.status,
      payment: payment
        ? {
            status: payment.status,
            sourceTxHash: payment.sourceTxHash,
            sourceBlock: payment.sourceBlock,
          }
        : null,
      proof: job ? { status: job.status, queryId: job.queryId } : null,
      settlement: job?.creditcoinTxHash
        ? {
            creditcoinTxHash: job.creditcoinTxHash,
            assetRecipient: sale.buyer,
            tokenId: sale.tokenId,
          }
        : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
