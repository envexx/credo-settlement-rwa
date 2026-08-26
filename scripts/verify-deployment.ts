import { Contract, JsonRpcProvider, Wallet } from "ethers";
import deployment from "../contracts/deployments/cc3-testnet.json" with { type: "json" };

const provider = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!);
const addresses = {
  decoder: deployment.contracts.EvmV1Decoder,
  rwa: process.env.TEST_RWA_ADDRESS!,
  settlement: process.env.SETTLE_RWA_ADDRESS!,
  verifier: process.env.PAYMENT_VERIFIER_USC_ADDRESS!,
};
const rwa = new Contract(
  addresses.rwa,
  ["function balanceOf(address,uint256) view returns(uint256)"],
  provider,
);
const settlement = new Contract(
  addresses.settlement,
  [
    "function verifier() view returns(address)",
    "function approvedAssets(address) view returns(bool)",
    "function supportedPaymentChains(uint64) view returns(uint64)",
    "function supportedPaymentTokens(uint64,address) view returns(bool)",
  ],
  provider,
);
const [codes, balance, boundVerifier, assetAllowed, chainId, tokenAllowed] =
  await Promise.all([
    Promise.all(
      Object.values(addresses).map((address) => provider.getCode(address)),
    ),
    rwa.getFunction("balanceOf")(wallet.address, 1001n) as Promise<bigint>,
    settlement.getFunction("verifier")() as Promise<string>,
    settlement.getFunction("approvedAssets")(addresses.rwa) as Promise<boolean>,
    settlement.getFunction("supportedPaymentChains")(1) as Promise<bigint>,
    settlement.getFunction("supportedPaymentTokens")(
      1,
      process.env.SEPOLIA_USDC_ADDRESS,
    ) as Promise<boolean>,
  ]);
const result = {
  wallet: wallet.address,
  bytecodePresent: Object.fromEntries(
    Object.keys(addresses).map((name, index) => [name, codes[index] !== "0x"]),
  ),
  demoAssetBalance: balance.toString(),
  verifierBinding: boundVerifier,
  assetAllowed,
  sourceChainId: chainId.toString(),
  officialUsdcAllowed: tokenAllowed,
};
if (
  Object.values(result.bytecodePresent).includes(false) ||
  balance !== 1n ||
  boundVerifier.toLowerCase() !== addresses.verifier.toLowerCase() ||
  !assetAllowed ||
  chainId !== 11155111n ||
  !tokenAllowed
)
  throw new Error(`DEPLOYMENT_VERIFICATION_FAILED ${JSON.stringify(result)}`);
console.log(JSON.stringify(result, null, 2));
