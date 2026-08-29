import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const required = [
  "docs/evidence/payment/sepolia-tx.json",
  "docs/evidence/attestcoin/proof-run.json",
  "docs/evidence/settlement/creditcoin-tx.json",
  "docs/evidence/rwa/before.json",
  "docs/evidence/rwa/after.json",
  "docs/evidence/contracts/addresses.json",
] as const;

test("evidence index links every settlement artifact", async () => {
  const index = await readFile(
    new URL("docs/evidence/README.md", root),
    "utf8",
  );
  for (const path of required) {
    await access(new URL(path, root));
    assert.match(index, new RegExp(path.replace("docs/evidence/", "")));
  }
  assert.match(index, /Sepolia payment/);
  assert.match(index, /Attestcoin proof/);
  assert.match(index, /Creditcoin settlement/);
  assert.match(index, /replay marker/i);
  assert.match(index, /not\s+an atomic/i);
});

test("evidence hashes and explorer hosts are valid", async () => {
  const payment = JSON.parse(
    await readFile(new URL(required[0], root), "utf8"),
  );
  const settlement = JSON.parse(
    await readFile(new URL(required[2], root), "utf8"),
  );
  assert.match(payment.txHash, /^0x[0-9a-fA-F]{64}$/);
  assert.match(settlement.txHash, /^0x[0-9a-fA-F]{64}$/);
  const index = await readFile(
    new URL("docs/evidence/README.md", root),
    "utf8",
  );
  const urls = index.match(/https:\/\/[^)\s]+/g) ?? [];
  const allowedHosts = new Set([
    "sepolia.etherscan.io",
    "creditcoin-testnet.blockscout.com",
  ]);
  assert.ok(urls.length >= 2);
  for (const url of urls) assert.ok(allowedHosts.has(new URL(url).hostname));
});
