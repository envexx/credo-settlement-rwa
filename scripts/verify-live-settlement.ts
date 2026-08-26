import { Contract, Interface, JsonRpcProvider, Wallet } from "ethers";
import { readFile, writeFile } from "node:fs/promises";

const creditcoinTxHash = process.argv[2];
if (!creditcoinTxHash) throw new Error("CREDITCOIN_TX_HASH_REQUIRED");
const job = JSON.parse(
  await readFile("docs/evidence/live/payment-job.json", "utf8"),
) as {
  sale: { saleId: string; buyer: string; paymentRecipient: string };
  sourceTxHash: string;
  sourceBlock: string;
  creationTxHash: string;
};
const buyer = new Wallet(process.env.BUYER_SEPOLIA_PRIVATE_KEY!);
const cc3 = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const verifierInterface = new Interface([
  "event PaymentProofAccepted(bytes32 indexed saleId,bytes32 indexed queryId,uint64 chainKey,uint64 sourceBlock)",
]);
const receipt = await cc3.getTransactionReceipt(creditcoinTxHash);
if (!receipt || receipt.status !== 1) throw new Error("SETTLEMENT_TX_FAILED");
const accepted = receipt.logs
  .map((log) => {
    try {
      return verifierInterface.parseLog(log);
    } catch {
      return null;
    }
  })
  .find((log) => log?.name === "PaymentProofAccepted");
if (!accepted) throw new Error("PAYMENT_PROOF_EVENT_NOT_FOUND");
const queryId = String(accepted.args.queryId);
const settlement = new Contract(
  process.env.SETTLE_RWA_ADDRESS!,
  [
    "function getSale(bytes32) view returns(tuple(address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
  ],
  cc3,
);
const verifier = new Contract(
  process.env.PAYMENT_VERIFIER_USC_ADDRESS!,
  ["function processedQueries(bytes32) view returns(bool)"],
  cc3,
);
const rwa = new Contract(
  process.env.TEST_RWA_ADDRESS!,
  ["function balanceOf(address,uint256) view returns(uint256)"],
  cc3,
);
const [
  sale,
  replayMarked,
  ownerBalance,
  escrowBalance,
  sourceReceipt,
  sourceBlock,
  targetBlock,
] = await Promise.all([
  settlement.getFunction("getSale")(job.sale.saleId),
  verifier.getFunction("processedQueries")(queryId) as Promise<boolean>,
  rwa.getFunction("balanceOf")(buyer.address, 1001n) as Promise<bigint>,
  rwa.getFunction("balanceOf")(
    process.env.SETTLE_RWA_ADDRESS,
    1001n,
  ) as Promise<bigint>,
  sepolia.getTransactionReceipt(job.sourceTxHash),
  sepolia.getBlock(Number(job.sourceBlock)),
  cc3.getBlock(receipt.blockNumber),
]);
const result = {
  saleId: job.sale.saleId,
  saleStatus: Number(sale.status),
  queryId,
  replayMarked,
  ownerBalance: ownerBalance.toString(),
  escrowBalance: escrowBalance.toString(),
  sourceTxHash: job.sourceTxHash,
  creditcoinTxHash,
  latencySeconds:
    sourceBlock && targetBlock
      ? targetBlock.timestamp - sourceBlock.timestamp
      : null,
};
if (
  result.saleStatus !== 2 ||
  sale.buyer.toLowerCase() !== buyer.address.toLowerCase() ||
  !replayMarked ||
  ownerBalance !== 1n ||
  escrowBalance !== 0n ||
  sourceReceipt?.status !== 1
)
  throw new Error(`LIVE_SETTLEMENT_INVALID ${JSON.stringify(result)}`);
await writeFile(
  "docs/evidence/payment/sepolia-tx.json",
  JSON.stringify(
    {
      status: "CONFIRMED",
      txHash: job.sourceTxHash,
      blockNumber: job.sourceBlock,
      token: process.env.SEPOLIA_USDC_ADDRESS,
      amountRaw: "5000000",
      from: buyer.address,
      to: job.sale.paymentRecipient,
    },
    null,
    2,
  ),
);
await writeFile(
  "docs/evidence/attestcoin/proof-run.json",
  JSON.stringify(
    {
      status: "ACCEPTED",
      queryId,
      sourceBlock: job.sourceBlock,
      latencySeconds: result.latencySeconds,
    },
    null,
    2,
  ),
);
await writeFile(
  "docs/evidence/settlement/creditcoin-tx.json",
  JSON.stringify(
    {
      status: "SETTLED",
      txHash: creditcoinTxHash,
      saleId: job.sale.saleId,
      queryId,
      assetRecipient: buyer.address,
      tokenId: "1001",
      replayMarked,
    },
    null,
    2,
  ),
);
await writeFile(
  "docs/evidence/rwa/after.json",
  JSON.stringify(
    {
      owner: buyer.address,
      tokenId: "1001",
      ownerBalance: result.ownerBalance,
      escrowBalance: result.escrowBalance,
      verifiedOnchain: true,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(result, null, 2));
