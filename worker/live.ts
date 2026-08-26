import { chainInfo, proofProvider } from "@gluwa/usc-sdk";
import { Contract, ethers, type Log } from "ethers";
import { readFile } from "node:fs/promises";
import { config } from "../src/lib/config";
import type { IndexedSale } from "../src/lib/store";
import { creditcoinProvider } from "../src/lib/rpc";
import { validateReceipt } from "./core";

const verifierAbi = [
  "function executePaymentProof(bytes32,uint64,uint64,bytes,bytes32,tuple(bytes32 hash,bool isLeft)[],bytes32,bytes32[]) returns (bool)",
  "event PaymentProofAccepted(bytes32 indexed saleId,bytes32 indexed queryId,uint64 chainKey,uint64 sourceBlock)",
];
const settlementAbi = [
  "function getSale(bytes32) view returns(tuple(address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
];

export async function processLivePayment(sale: IndexedSale, txHash: string) {
  if (
    !config.SEPOLIA_RPC_URL ||
    !config.CREDITCOIN_WORKER_PRIVATE_KEY ||
    !config.PAYMENT_VERIFIER_USC_ADDRESS ||
    !config.SETTLE_RWA_ADDRESS
  )
    throw new Error("LIVE_WORKER_CONFIG_MISSING");
  const source = new ethers.JsonRpcProvider(config.SEPOLIA_RPC_URL);
  const creditcoin = creditcoinProvider(
    config.CREDITCOIN_RPC_URL,
    config.CREDITCOIN_RPC_FALLBACK_URL,
  );
  const receipt = await source.getTransactionReceipt(txHash);
  if (!receipt) throw new Error("SOURCE_TX_PENDING");
  validateReceipt(receipt, sale);
  const builder = new proofProvider.service.ProofBuilder(
    sale.paymentChainKey,
    config.CREDITCOIN_PROOF_BUILDER_URL,
  );
  const info = new chainInfo.PrecompileChainInfoProvider(
    creditcoin as ethers.JsonRpcProvider,
  );
  const latest = await info.getLatestAttestedHeightAndHash(
    sale.paymentChainKey,
  );
  console.log(
    JSON.stringify({
      level: "info",
      service: "proof-worker",
      saleId: sale.saleId,
      sourceTxHash: txHash,
      sourceBlock: receipt.blockNumber,
      stage: "WAITING_ATTESTATION",
      latestAttested: latest.height,
    }),
  );
  await builder.waitUntilHeightAttested(
    sale.paymentChainKey,
    receipt.blockNumber,
    15_000,
    1_200_000,
  );
  const result = await builder.getProof(txHash);
  if (!result.success || !result.data)
    throw new Error(result.error ?? "PROOF_GENERATION_FAILED");
  const proof = result.data;
  const signer = new ethers.Wallet(
    config.CREDITCOIN_WORKER_PRIVATE_KEY,
    creditcoin,
  );
  const contract = new Contract(
    config.PAYMENT_VERIFIER_USC_ADDRESS,
    verifierAbi,
    signer,
  );
  const args = [
    sale.saleId,
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof.root,
    proof.merkleProof.siblings,
    proof.continuityProof.lowerEndpointDigest,
    proof.continuityProof.roots,
  ] as const;
  const execute = contract.getFunction("executePaymentProof");
  let gasLimit: bigint;
  try {
    gasLimit = ((await execute.estimateGas(...args)) * 135n) / 100n;
  } catch {
    gasLimit =
      1_500_000n + BigInt(proof.continuityProof.roots.length) * 10_000n;
  }
  const tx = await execute(...args, { gasLimit });
  const settled = await tx.wait();
  if (!settled || settled.status !== 1)
    throw new Error("SETTLEMENT_TRANSACTION_FAILED");
  const accepted = settled.logs
    .map((log: Log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(
      (log: ReturnType<typeof contract.interface.parseLog> | null) =>
        log?.name === "PaymentProofAccepted",
    );
  if (!accepted) throw new Error("PAYMENT_PROOF_EVENT_NOT_FOUND");
  const onchainSale = await new Contract(
    config.SETTLE_RWA_ADDRESS!,
    settlementAbi,
    creditcoin,
  ).getFunction("getSale")(sale.saleId);
  if (Number(onchainSale.status) !== 2)
    throw new Error("ONCHAIN_RECONCILIATION_FAILED");
  return {
    creditcoinTxHash: settled.hash as string,
    sourceBlock: receipt.blockNumber.toString(),
    queryId: String(accepted.args.queryId),
  };
}

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: npm run worker -- payment.json");
  const data = JSON.parse(await readFile(input, "utf8")) as {
    sale: IndexedSale;
    sourceTxHash: string;
  };
  console.log(
    JSON.stringify(await processLivePayment(data.sale, data.sourceTxHash)),
  );
}
if (process.argv[1]?.endsWith("live.ts"))
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
