import "dotenv/config";
import dotenv from "dotenv";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  formatEther,
  formatUnits,
} from "ethers";

dotenv.config({ path: ".env.local", override: true });

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
const workerKey = process.env.CREDITCOIN_WORKER_PRIVATE_KEY;
const buyerKey = process.env.BUYER_SEPOLIA_PRIVATE_KEY;
if (!deployerKey || !workerKey || !buyerKey)
  throw new Error(
    "DEPLOYER_PRIVATE_KEY, CREDITCOIN_WORKER_PRIVATE_KEY, and BUYER_SEPOLIA_PRIVATE_KEY are required",
  );
const deployer = new Wallet(deployerKey);
const worker = new Wallet(workerKey);
const buyer = new Wallet(buyerKey);
const cc3 = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
const sepoliaUrl = process.env.SEPOLIA_RPC_URL;
const [cc3Network, deployerTctc, workerTctc] = await Promise.all([
  cc3.getNetwork(),
  cc3.getBalance(deployer.address),
  cc3.getBalance(worker.address),
]);
if (cc3Network.chainId !== 102031n)
  throw new Error(`Wrong Creditcoin chain: ${cc3Network.chainId}`);
const balances: Record<string, string> = {
  tCTC: formatEther(deployerTctc),
  workerTCTC: formatEther(workerTctc),
};
if (sepoliaUrl) {
  const sepolia = new JsonRpcProvider(sepoliaUrl);
  const usdc = new Contract(
    process.env.SEPOLIA_USDC_ADDRESS!,
    ["function balanceOf(address) view returns (uint256)"],
    sepolia,
  );
  const [network, eth, usdcBalance] = await Promise.all([
    sepolia.getNetwork(),
    sepolia.getBalance(buyer.address),
    usdc.getFunction("balanceOf")(buyer.address) as Promise<bigint>,
  ]);
  if (network.chainId !== 11155111n)
    throw new Error(`Wrong Sepolia chain: ${network.chainId}`);
  balances.sepoliaETH = formatEther(eth);
  balances.sepoliaUSDC = formatUnits(usdcBalance, 6);
}
console.log(
  JSON.stringify(
    {
      wallet: deployer.address,
      buyer: buyer.address,
      sameWallet: deployer.address === worker.address,
      sepoliaRpcConfigured: Boolean(sepoliaUrl),
      balances,
    },
    null,
    2,
  ),
);
