import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  ethers,
} from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { config } from "../../src/lib/config";

type Link = { start: number; length: number };
type Artifact = {
  abi: object[];
  bytecode: {
    object: string;
    linkReferences?: Record<string, Record<string, Link[]>>;
  };
};
async function artifact(name: string) {
  return JSON.parse(
    await readFile(`contracts/out/${name}.sol/${name}.json`, "utf8"),
  ) as Artifact;
}
async function deploy(
  name: string,
  signer: Wallet,
  args: unknown[],
): Promise<Contract> {
  const a = await artifact(name);
  const contract = await new ContractFactory(
    a.abi,
    a.bytecode.object,
    signer,
  ).deploy(...args);
  await contract.waitForDeployment();
  return contract as unknown as Contract;
}

function linkBytecode(a: Artifact, libraryAddress: string) {
  let bytecode = a.bytecode.object;
  const offset = bytecode.startsWith("0x") ? 2 : 0;
  for (const file of Object.values(a.bytecode.linkReferences ?? {})) {
    for (const links of Object.values(file)) {
      for (const link of links) {
        const start = offset + link.start * 2;
        bytecode = `${bytecode.slice(0, start)}${libraryAddress.slice(2).toLowerCase()}${bytecode.slice(start + link.length * 2)}`;
      }
    }
  }
  return bytecode;
}

if (!config.DEPLOYER_PRIVATE_KEY)
  throw new Error("DEPLOYER_PRIVATE_KEY_REQUIRED");
const signer = new Wallet(
  config.DEPLOYER_PRIVATE_KEY,
  new JsonRpcProvider(config.CREDITCOIN_RPC_URL),
);
const rwa = await deploy("TestRWA", signer, [
  signer.address,
  "ipfs://settlerwa/{id}.json",
]);
const settlement = await deploy("SettleRWA", signer, [signer.address]);
const decoder = await deploy("EvmV1Decoder", signer, []);
const verifierArtifact = await artifact("PaymentVerifierUSC");
const verifier = (await new ContractFactory(
  verifierArtifact.abi,
  linkBytecode(verifierArtifact, await decoder.getAddress()),
  signer,
).deploy(await settlement.getAddress())) as unknown as Contract;
await verifier.waitForDeployment();
await (
  await settlement.getFunction("setVerifier")(await verifier.getAddress())
).wait();
await (
  await settlement.getFunction("configureAsset")(await rwa.getAddress(), true)
).wait();
await (
  await settlement.getFunction("configurePaymentSource")(
    config.SEPOLIA_ATTESTCOIN_CHAIN_KEY,
    config.SEPOLIA_CHAIN_ID,
    config.SEPOLIA_USDC_ADDRESS,
    true,
  )
).wait();
const metadataHash = ethers.keccak256(
  ethers.toUtf8Bytes(
    "Demo Treasury Note 2026-A|DTR-2026-001|TOKENIZED_TREASURY_DEMO|5000 USD|Creditcoin CC3 Testnet|testnet=true|economicValue=false",
  ),
);
await (
  await rwa.getFunction("mint")(signer.address, 1001n, 1n, metadataHash)
).wait();
const manifest = {
  network: "creditcoin-cc3-testnet",
  chainId: config.CREDITCOIN_CHAIN_ID,
  contracts: {
    EvmV1Decoder: await decoder.getAddress(),
    TestRWA: await rwa.getAddress(),
    SettleRWA: await settlement.getAddress(),
    PaymentVerifierUSC: await verifier.getAddress(),
  },
  source: {
    chainKey: config.SEPOLIA_ATTESTCOIN_CHAIN_KEY,
    chainId: config.SEPOLIA_CHAIN_ID,
    usdc: config.SEPOLIA_USDC_ADDRESS,
  },
};
await mkdir("contracts/deployments", { recursive: true });
await writeFile(
  "contracts/deployments/cc3-testnet.json",
  JSON.stringify(manifest, null, 2),
);
console.log(manifest);
