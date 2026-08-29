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
