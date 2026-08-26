import { ApiError, apiError } from "@/lib/http";
import { findSale } from "@/lib/store";
import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  context: { params: Promise<{ saleId: string }> },
) {
  try {
    const { saleId } = await context.params;
    const sale = await findSale(saleId);
    if (!sale) throw new ApiError(404, "SALE_NOT_FOUND", "Sale was not found");
    return NextResponse.json({
      saleId: sale.saleId,
      status: sale.status,
      seller: sale.seller,
      buyer: sale.buyer,
      asset: {
        chainId: 102031,
        contract: sale.assetContract,
        tokenId: sale.tokenId,
        amount: sale.assetAmount,
      },
      payment: {
        chainId: sale.paymentChainId,
        chainKey: sale.paymentChainKey,
        token: sale.paymentToken,
        symbol: "USDC",
        decimals: 6,
        recipient: sale.paymentRecipient,
        amountRaw: sale.paymentAmount,
      },
      sourceBlockWindow: {
        start: sale.sourceStartBlock,
        end: sale.sourceEndBlock,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
