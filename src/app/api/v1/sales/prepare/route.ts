import { requireWallet } from "@/lib/auth";
import { config } from "@/lib/config";
import { ApiError, apiError } from "@/lib/http";
import { parseUsdc } from "@/lib/money";
import { prepareSaleRequest } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { protectRequest } from "@/lib/security";
import { Contract } from "ethers";
import { creditcoinProvider } from "@/lib/rpc";

export async function POST(request: Request) {
  try {
    protectRequest(request);
    const seller = await requireWallet();
    const body = prepareSaleRequest.parse(await request.json());
    if (body.paymentRecipient.toLowerCase() !== seller)
      throw new ApiError(
        403,
        "RECIPIENT_WALLET_MISMATCH",
        "Payment recipient must be the authenticated seller",
      );
    if (!config.SETTLE_RWA_ADDRESS)
      throw new ApiError(
        503,
        "CONTRACT_NOT_CONFIGURED",
        "SettleRWA deployment address is missing",
      );
    if (!config.SEPOLIA_RPC_URL)
      throw new ApiError(
        503,
        "SEPOLIA_RPC_NOT_CONFIGURED",
        "Sepolia RPC is missing",
      );
    const latest = await createPublicClient({
      chain: sepolia,
      transport: http(config.SEPOLIA_RPC_URL),
    }).getBlockNumber();
    const paymentAmount = parseUsdc(body.paymentAmount);
    const cc3 = creditcoinProvider(
      config.CREDITCOIN_RPC_URL,
      config.CREDITCOIN_RPC_FALLBACK_URL,
    );
    const asset = new Contract(
      body.assetContract,
      ["function balanceOf(address,uint256) view returns(uint256)"],
      cc3,
    );
    const balance = (await asset.getFunction("balanceOf")(
      seller,
      BigInt(body.tokenId),
    )) as bigint;
    if (balance < BigInt(body.assetAmount))
      throw new ApiError(
        422,
        "INSUFFICIENT_ASSET_BALANCE",
        "Seller does not own the requested asset amount",
      );
    const start = latest + 1n;
    const end = start + 7_200n;
    return NextResponse.json({
      contract: config.SETTLE_RWA_ADDRESS,
      method: "createSale",
      params: {
        ...body,
        paymentChainKey: config.SEPOLIA_ATTESTCOIN_CHAIN_KEY.toString(),
        paymentChainId: config.SEPOLIA_CHAIN_ID.toString(),
        paymentToken: config.SEPOLIA_USDC_ADDRESS,
        paymentAmount: paymentAmount.toString(),
        sourceStartBlock: start.toString(),
        sourceEndBlock: end.toString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
