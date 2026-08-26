import { requireWallet } from "@/lib/auth";
import { config } from "@/lib/config";
import { ApiError, apiError } from "@/lib/http";
import { indexSaleRequest } from "@/lib/schemas";
import { protectRequest } from "@/lib/security";
import { persistSale } from "@/lib/store";
import { Contract, Interface } from "ethers";
import { creditcoinProvider } from "@/lib/rpc";
import { NextResponse } from "next/server";

const saleCreated = new Interface([
  "event SaleCreated(bytes32 indexed saleId,address indexed seller,address indexed buyer,bytes32 paymentTuple)",
]);
const settlementAbi = [
  "function getSale(bytes32) view returns(tuple(address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
];

export async function POST(request: Request) {
  try {
    protectRequest(request);
    const seller = await requireWallet();
    const body = indexSaleRequest.parse(await request.json());
    if (!config.SETTLE_RWA_ADDRESS)
      throw new ApiError(
        503,
        "CONTRACT_NOT_CONFIGURED",
        "SettleRWA deployment address is missing",
      );
    const provider = creditcoinProvider(
      config.CREDITCOIN_RPC_URL,
      config.CREDITCOIN_RPC_FALLBACK_URL,
    );
    const receipt = await provider.getTransactionReceipt(body.creationTxHash);
    if (
      !receipt ||
      receipt.status !== 1 ||
      receipt.to?.toLowerCase() !== config.SETTLE_RWA_ADDRESS.toLowerCase()
    )
      throw new ApiError(
        422,
        "INVALID_SALE_TRANSACTION",
        "Transaction is not a successful SettleRWA call",
      );
    const event = receipt.logs
      .map((log) => {
        try {
          return saleCreated.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "SaleCreated");
    if (
      !event ||
      String(event.args.saleId).toLowerCase() !== body.saleId.toLowerCase()
    )
      throw new ApiError(
        422,
        "SALE_EVENT_MISMATCH",
        "SaleCreated event does not match the requested sale",
      );
    if (String(event.args.seller).toLowerCase() !== seller)
      throw new ApiError(
        403,
        "SELLER_WALLET_MISMATCH",
        "Sale was created by another wallet",
      );
    const sale = await new Contract(
      config.SETTLE_RWA_ADDRESS,
      settlementAbi,
      provider,
    ).getFunction("getSale")(body.saleId);
    if (Number(sale.status) !== 1)
      throw new ApiError(410, "SALE_NOT_OPEN", "On-chain sale is not open");
    await persistSale({
      saleId: body.saleId,
      seller: sale.seller,
      buyer: sale.buyer,
      assetContract: sale.assetContract,
      tokenId: sale.tokenId.toString(),
      assetAmount: sale.assetAmount.toString(),
      paymentChainKey: Number(sale.paymentChainKey),
      paymentChainId: Number(sale.paymentChainId),
      paymentToken: sale.paymentToken,
      paymentRecipient: sale.paymentRecipient,
      paymentAmount: sale.paymentAmount.toString(),
      sourceStartBlock: sale.sourceStartBlock.toString(),
      sourceEndBlock: sale.sourceEndBlock.toString(),
      status: "OPEN",
    });
    return NextResponse.json(
      { indexed: true, saleId: body.saleId },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
