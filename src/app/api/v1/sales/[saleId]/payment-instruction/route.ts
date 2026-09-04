import { requireWallet } from "@/lib/auth";
import { ApiError, apiError } from "@/lib/http";
import { findSale } from "@/lib/store";
import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  context: { params: Promise<{ saleId: string }> },
) {
  try {
    const wallet = await requireWallet();
    const sale = await findSale((await context.params).saleId);
    if (!sale) throw new ApiError(404, "SALE_NOT_FOUND", "Sale was not found");
    if (wallet !== sale.buyer.toLowerCase())
      throw new ApiError(
        403,
        "BUYER_WALLET_MISMATCH",
        "Only the bound buyer may read payment instructions",
      );
    if (sale.status !== "OPEN")
      throw new ApiError(410, "SALE_NOT_PAYABLE", "Sale is no longer payable");
    return NextResponse.json({
      chainId: sale.paymentChainId,
      token: sale.paymentToken,
      method: "transfer",
      recipient: sale.paymentRecipient,
      amountRaw: sale.paymentAmount,
    });
  } catch (error) {
    return apiError(error);
  }
}
