import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function content(path: string) {
  return readFile(new URL(path, root), "utf8");
}

test("deployment manifest exposes integration metadata", async () => {
  const manifest = JSON.parse(
    await content("contracts/deployments/cc3-testnet.json"),
  );
  assert.equal(manifest.network, "creditcoin-cc3-testnet");
  assert.equal(manifest.chainId, 102031);
  assert.equal(
    manifest.deployment.sourceCommit,
    "b70c4211939a5f1b7186e9637d5d41bef6e2cfb5",
  );
  assert.equal(manifest.protocolLimits.maxWindowBlocks, 50000);
  assert.equal(manifest.protocolLimits.reclaimDelaySeconds, 86400);
  assert.equal(manifest.protocolLimits.estimatedSourceBlockTimeSeconds, 12);
  for (const name of ["TestRWA", "SettleRWA", "PaymentVerifierUSC"]) {
    assert.match(manifest.deployment.txs[name].hash, /^0x[0-9a-fA-F]{64}$/);
    assert.match(manifest.deployment.txs[name].explorer, /^https:\/\//);
  }
});

test("published integration ABIs match generated public artifacts", async () => {
  for (const name of ["SettleRWA", "TestRWA", "PaymentVerifierUSC"]) {
    const generated = JSON.parse(await content(`public/abi/${name}.json`));
    const published = JSON.parse(
      await content(`docs/integration/abis/${name}.json`),
    );
    assert.deepEqual(published, generated);
  }
});

test("parameter specification covers createSale integration hazards", async () => {
  const spec = await content("docs/integration/PARAM-SPEC.md");
  for (const argument of [
    "buyer",
    "assetContract",
    "tokenId",
    "assetAmount",
    "paymentChainKey",
    "paymentChainId",
    "paymentToken",
    "paymentRecipient",
    "paymentAmount",
    "sourceStartBlock",
    "sourceEndBlock",
  ]) {
    assert.match(spec, new RegExp(`\\b${argument}\\b`));
  }
  assert.match(spec, /chainKey is not chainId/);
  assert.match(spec, /Do not use JavaScript `number`/);
  assert.match(spec, /0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238/);
  assert.match(spec, /50,000/);
  assert.match(spec, /24 hours/);
});

test("canonical guide documents only implemented integration routes", async () => {
  const [guide, readme, infra] = await Promise.all([
    content("docs/integration/README.md"),
    content("README.md"),
    content("src/app/infra/page.tsx"),
  ]);
  for (const route of [
    "/api/v1/sales/prepare",
    "/api/v1/sales/index",
    "/api/v1/sales/:saleId/payment",
    "/api/v1/sales/:saleId/settlement",
  ]) {
    assert.match(guide, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(guide, /POST \/api\/v1\/sales(?:\s|`)/);
  assert.match(guide, /## Thin TypeScript client/);
  assert.match(guide, /CredoClient/);
  assert.match(guide, /waitForSettlement/);
  assert.match(readme, /docs\/integration\/README\.md/);
  assert.match(infra, /Repository integration guide/);
});
