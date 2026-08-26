import { Contract, JsonRpcProvider, Wallet, ethers } from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";

type Artifact = { abi: object[] };
const artifact = async (name: string) =>
  JSON.parse(
    await readFile(`contracts/out/${name}.sol/${name}.json`, "utf8"),
  ) as Artifact;
const key = process.env.DEPLOYER_PRIVATE_KEY!;
const buyerKey = process.env.BUYER_SEPOLIA_PRIVATE_KEY;
if (!buyerKey) throw new Error("BUYER_SEPOLIA_PRIVATE_KEY_REQUIRED");
const wallet = new Wallet(key);
const buyer = new Wallet(buyerKey);
const cc3 = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
const sepolia = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const ccSigner = wallet.connect(cc3);
const sepoliaSigner = buyer.connect(sepolia);
const rwa = new Contract(
  process.env.TEST_RWA_ADDRESS!,
  (await artifact("TestRWA")).abi,
  ccSigner,
);
const settlement = new Contract(
  process.env.SETTLE_RWA_ADDRESS!,
  (await artifact("SettleRWA")).abi,
  ccSigner,
);
const usdc = new Contract(
  process.env.SEPOLIA_USDC_ADDRESS!,
  ["function transfer(address,uint256) returns(bool)"],
  sepoliaSigner,
);
if (
  !(await rwa.getFunction("isApprovedForAll")(
    wallet.address,
    process.env.SETTLE_RWA_ADDRESS,
  ))
)
  await (
    await rwa.getFunction("setApprovalForAll")(
      process.env.SETTLE_RWA_ADDRESS,
      true,
    )
  ).wait();
const latest = await sepolia.getBlockNumber();
const start = latest + 1;
const end = start + 7_200;
const amount = 5_000_000n;
const createTx = await settlement.getFunction("createSale")(
  buyer.address,
  process.env.TEST_RWA_ADDRESS,
  1001n,
  1n,
  1,
  11155111,
  process.env.SEPOLIA_USDC_ADDRESS,
  wallet.address,
  amount,
  start,
  end,
);
const createReceipt = await createTx.wait();
const parsed = createReceipt.logs
  .map((log: { topics: readonly string[]; data: string }) => {
    try {
      return settlement.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
    } catch {
      return null;
    }
  })
  .find((log: { name?: string } | null) => log?.name === "SaleCreated");
if (!parsed) throw new Error("SALE_CREATED_EVENT_NOT_FOUND");
const saleId = String(parsed.args.saleId);
const paymentTx = await usdc.getFunction("transfer")(wallet.address, amount);
const paymentReceipt = await paymentTx.wait();
const sale = {
  saleId,
  seller: wallet.address,
  buyer: buyer.address,
  assetContract: process.env.TEST_RWA_ADDRESS!,
  tokenId: "1001",
  assetAmount: "1",
  paymentChainKey: 1,
  paymentChainId: 11155111,
  paymentToken: process.env.SEPOLIA_USDC_ADDRESS!,
  paymentRecipient: wallet.address,
  paymentAmount: amount.toString(),
  sourceStartBlock: String(start),
  sourceEndBlock: String(end),
  status: "OPEN" as const,
};
const evidence = {
  sale,
  sourceTxHash: paymentReceipt.hash,
  creationTxHash: createReceipt.hash,
  sourceBlock: String(paymentReceipt.blockNumber),
};
await mkdir("docs/evidence/live", { recursive: true });
await writeFile(
  "docs/evidence/live/payment-job.json",
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence, null, 2));
