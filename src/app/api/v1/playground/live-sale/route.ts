import { requireWallet } from "@/lib/auth";
import { config } from "@/lib/config";
import { ApiError, apiError } from "@/lib/http";
import {
  assertReservationAllowed,
  buildDemoSaleTerms,
  demoSellerAddress,
  DEMO_TOKEN_ID,
  isReclaimable,
  settlementAbi,
  testRwaAbi,
} from "@/lib/live-demo";
import { creditcoinProvider } from "@/lib/rpc";
import {
  countOpenDemoSales,
  findOpenDemoSaleForBuyer,
  findOpenDemoSales,
  markSaleReclaimed,
  persistSale,
  withDemoSellerLock,
} from "@/lib/store";
import { protectRequest } from "@/lib/security";
import { Contract, Interface, type Log, Wallet } from "ethers";
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const saleCreated = new Interface([
  "event SaleCreated(bytes32 indexed saleId,address indexed seller,address indexed buyer,bytes32 paymentTuple)",
]);

function sepoliaClient() {
  if (!config.SEPOLIA_RPC_URL)
    throw new ApiError(
      503,
      "SEPOLIA_RPC_NOT_CONFIGURED",
      "Sepolia RPC is missing",
    );
  return createPublicClient({
    chain: sepolia,
    transport: http(config.SEPOLIA_RPC_URL),
  });
}

async function reclaimExpiredDemoSales(
  settlement: Contract,
  demoSeller: string,
) {
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  for (const saleId of await findOpenDemoSales(demoSeller)) {
    const sale = await settlement.getFunction("getSale")(saleId);
    if (
      Number(sale.status) !== 1 ||
      !isReclaimable(BigInt(sale.reclaimAfter), nowSeconds)
    )
      continue;
    const tx = await settlement.getFunction("reclaim")(saleId);
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1)
      throw new ApiError(
        502,
        "DEMO_RECLAIM_FAILED",
        "Demo inventory recovery failed",
      );
    await markSaleReclaimed(saleId);
  }
}

export async function POST(request: Request) {
  try {
    protectRequest(request);
    const buyer = await requireWallet();
    if (
      !config.DEMO_SELLER_PRIVATE_KEY ||
      !config.TEST_RWA_ADDRESS ||
      !config.SETTLE_RWA_ADDRESS
    )
      throw new ApiError(
        503,
        "LIVE_DEMO_NOT_CONFIGURED",
        "Live demo seller is not configured",
      );

    const result = await withDemoSellerLock(async () => {
      const creditcoin = creditcoinProvider(
        config.CREDITCOIN_RPC_URL,
        config.CREDITCOIN_RPC_FALLBACK_URL,
      );
      const seller = new Wallet(config.DEMO_SELLER_PRIVATE_KEY!, creditcoin);
      const demoSeller = demoSellerAddress(config.DEMO_SELLER_PRIVATE_KEY!);
      const settlement = new Contract(
        config.SETTLE_RWA_ADDRESS!,
        settlementAbi,
        seller,
      );
      await reclaimExpiredDemoSales(settlement, demoSeller);

      const [existingSale, openCount, inventory, latestSourceBlock] =
        await Promise.all([
          findOpenDemoSaleForBuyer(demoSeller, buyer),
          countOpenDemoSales(demoSeller),
          new Contract(
            config.TEST_RWA_ADDRESS!,
            testRwaAbi,
            creditcoin,
          ).getFunction("balanceOf")(demoSeller, DEMO_TOKEN_ID),
          sepoliaClient().getBlockNumber(),
        ]);
      assertReservationAllowed({
        buyerHasOpenSale: Boolean(existingSale),
        openCount,
        inventory: BigInt(inventory),
      });

      const terms = buildDemoSaleTerms({
        buyer,
        seller: demoSeller,
        assetContract: config.TEST_RWA_ADDRESS!,
        paymentToken: config.SEPOLIA_USDC_ADDRESS,
        latestSourceBlock,
      });
      const createSale = settlement.getFunction("createSale");
      const args = [
        terms.buyer,
        terms.assetContract,
        terms.tokenId,
        terms.assetAmount,
        BigInt(config.SEPOLIA_ATTESTCOIN_CHAIN_KEY),
        BigInt(config.SEPOLIA_CHAIN_ID),
        terms.paymentToken,
        terms.paymentRecipient,
        terms.paymentAmount,
        terms.sourceStartBlock,
        terms.sourceEndBlock,
      ] as const;
      let receipt;
      try {
        const gasLimit =
          ((await createSale.estimateGas(...args)) * 135n) / 100n;
        const tx = await createSale(...args, { gasLimit });
        receipt = await tx.wait();
      } catch {
        throw new ApiError(
          502,
          "DEMO_ESCROW_FAILED",
          "Live RWA escrow transaction failed",
        );
      }
      if (!receipt || receipt.status !== 1)
        throw new ApiError(
          502,
          "DEMO_ESCROW_FAILED",
          "Live RWA escrow transaction failed",
        );
      const created = receipt.logs
        .map((log: Log) => {
          try {
            return saleCreated.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(
          (log: ReturnType<typeof saleCreated.parseLog> | null) =>
            log?.name === "SaleCreated",
        );
      if (!created)
        throw new ApiError(
          502,
          "DEMO_ESCROW_FAILED",
          "Live sale event was not emitted",
        );
      const saleId = String(created.args.saleId);
      const onchainSale = await settlement.getFunction("getSale")(saleId);
      if (Number(onchainSale.status) !== 1)
        throw new ApiError(502, "DEMO_SALE_NOT_OPEN", "Live sale is not open");
      await persistSale({
        saleId,
        seller: onchainSale.seller,
        buyer: onchainSale.buyer,
        assetContract: onchainSale.assetContract,
        tokenId: onchainSale.tokenId.toString(),
        assetAmount: onchainSale.assetAmount.toString(),
        paymentChainKey: Number(onchainSale.paymentChainKey),
        paymentChainId: Number(onchainSale.paymentChainId),
        paymentToken: onchainSale.paymentToken,
        paymentRecipient: onchainSale.paymentRecipient,
        paymentAmount: onchainSale.paymentAmount.toString(),
        sourceStartBlock: onchainSale.sourceStartBlock.toString(),
        sourceEndBlock: onchainSale.sourceEndBlock.toString(),
        status: "OPEN",
      });
      return {
        saleId,
        creationTxHash: receipt.hash,
        payment: {
          chainId: config.SEPOLIA_CHAIN_ID,
          token: terms.paymentToken,
          recipient: terms.paymentRecipient,
          amountRaw: terms.paymentAmount.toString(),
        },
      };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
