import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const creationTxHash = process.argv[2];
if (!creationTxHash) throw new Error("CREATION_TX_HASH_REQUIRED");
const cc3 = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const buyer = new Wallet(process.env.BUYER_SEPOLIA_PRIVATE_KEY!, sepolia);
const artifact = JSON.parse(
  await readFile("contracts/out/SettleRWA.sol/SettleRWA.json", "utf8"),
) as { abi: object[] };
const settlement = new Contract(
  process.env.SETTLE_RWA_ADDRESS!,
  artifact.abi,
  cc3,
);
const receipt = await cc3.getTransactionReceipt(creationTxHash);
if (!receipt || receipt.status !== 1) throw new Error("INVALID_CREATION_TX");
const event = receipt.logs
  .map((log) => {
    try {
      return settlement.interface.parseLog(log);
    } catch {
      return null;
    }
  })
  .find((log) => log?.name === "SaleCreated");
if (!event) throw new Error("SALE_CREATED_EVENT_NOT_FOUND");
const saleId = String(event.args.saleId);
const chainSale = await settlement.getFunction("getSale")(saleId);
if (Number(chainSale.status) !== 1) throw new Error("SALE_NOT_OPEN");
if (chainSale.buyer.toLowerCase() !== buyer.address.toLowerCase())
  throw new Error("BUYER_MISMATCH");
const usdc = new Contract(
  process.env.SEPOLIA_USDC_ADDRESS!,
  ["function transfer(address,uint256) returns(bool)"],
  buyer,
);
const payment = await usdc.getFunction("transfer")(
  chainSale.paymentRecipient,
  chainSale.paymentAmount,
);
const paymentReceipt = await payment.wait();
const evidence = {
  sale: {
    saleId,
    seller: chainSale.seller,
    buyer: chainSale.buyer,
    assetContract: chainSale.assetContract,
    tokenId: chainSale.tokenId.toString(),
    assetAmount: chainSale.assetAmount.toString(),
    paymentChainKey: Number(chainSale.paymentChainKey),
    paymentChainId: Number(chainSale.paymentChainId),
    paymentToken: chainSale.paymentToken,
    paymentRecipient: chainSale.paymentRecipient,
    paymentAmount: chainSale.paymentAmount.toString(),
    sourceStartBlock: chainSale.sourceStartBlock.toString(),
    sourceEndBlock: chainSale.sourceEndBlock.toString(),
    status: "OPEN" as const,
  },
  sourceTxHash: paymentReceipt.hash,
  creationTxHash,
  sourceBlock: String(paymentReceipt.blockNumber),
};
await mkdir("docs/evidence/live", { recursive: true });
await writeFile(
  "docs/evidence/live/payment-job.json",
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence, null, 2));
