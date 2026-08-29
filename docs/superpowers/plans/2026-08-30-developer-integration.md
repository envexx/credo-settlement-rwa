# Credo Developer Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a source-checked package that lets a developer locate the CC3 deployment, understand `createSale`, obtain ABIs, and monitor settlement.

**Architecture:** Treat deployed Solidity, the CC3 manifest, and immutable evidence as sources of truth. Publish human-readable guides beside mechanically copied generated ABIs, protect important claims with Node tests, and expose one builder entry point from README and in-app docs.

**Tech Stack:** Markdown, JSON, Solidity source, generated Foundry ABI JSON, TypeScript, Node test runner, Next.js docs page

---

## File map

- Create `docs/integration/README.md`: complete integration sequence.
- Create `docs/integration/PARAM-SPEC.md`: exact argument and error reference.
- Create `docs/integration/ABI-STABILITY.md`: supported and admin surfaces.
- Create `docs/integration/abis/*.json`: mechanical copies of generated public ABIs.
- Create `src/app/integration-docs.test.ts`: documentation contract tests.
- Modify `contracts/deployments/cc3-testnet.json`: proven metadata and limits.
- Modify `README.md` and `src/app/infra/page.tsx`: builder entry links.
- Modify `package.json`: include the new test.

### Task 1: Extend the canonical deployment manifest

**Files:**
- Create: `src/app/integration-docs.test.ts`
- Modify: `contracts/deployments/cc3-testnet.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing manifest test**

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

test("deployment manifest exposes integration metadata", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("contracts/deployments/cc3-testnet.json", root), "utf8"),
  );
  assert.equal(manifest.network, "creditcoin-cc3-testnet");
  assert.equal(manifest.chainId, 102031);
  assert.equal(manifest.deployment.sourceCommit, "b70c4211939a5f1b7186e9637d5d41bef6e2cfb5");
  assert.equal(manifest.protocolLimits.maxWindowBlocks, 50000);
  assert.equal(manifest.protocolLimits.reclaimDelaySeconds, 86400);
  assert.equal(manifest.protocolLimits.estimatedSourceBlockTimeSeconds, 12);
  for (const name of ["TestRWA", "SettleRWA", "PaymentVerifierUSC"]) {
    assert.match(manifest.deployment.txs[name].hash, /^0x[0-9a-fA-F]{64}$/);
    assert.match(manifest.deployment.txs[name].explorer, /^https:\/\//);
  }
});
```

- [ ] **Step 2: Verify red**

Run: `npx tsx src/app/integration-docs.test.ts`

Expected: FAIL because `deployment` and `protocolLimits` are absent.

- [ ] **Step 3: Extend the manifest with proven values**

Preserve existing fields and add:

```json
"deployment": {
  "sourceCommit": "b70c4211939a5f1b7186e9637d5d41bef6e2cfb5",
  "verified": false,
  "txs": {
    "TestRWA": {
      "hash": "0xfd436fa3e965b8e66d22f72887349c45136a77e519b6f419899c209da8175ffd",
      "explorer": "https://creditcoin-testnet.blockscout.com/tx/0xfd436fa3e965b8e66d22f72887349c45136a77e519b6f419899c209da8175ffd"
    },
    "SettleRWA": {
      "hash": "0x80822e27d00dbf9f9ec57a6daff6447b05f70ae58726965d5de58be48cd13f89",
      "explorer": "https://creditcoin-testnet.blockscout.com/tx/0x80822e27d00dbf9f9ec57a6daff6447b05f70ae58726965d5de58be48cd13f89"
    },
    "PaymentVerifierUSC": {
      "hash": "0x91cb37733e53f1981e93c7df4638ef2b3d772dc0045ee12bc1a58721fce98e55",
      "explorer": "https://creditcoin-testnet.blockscout.com/tx/0x91cb37733e53f1981e93c7df4638ef2b3d772dc0045ee12bc1a58721fce98e55"
    }
  }
},
"protocolLimits": {
  "maxWindowBlocks": 50000,
  "reclaimDelaySeconds": 86400,
  "estimatedSourceBlockTimeSeconds": 12
}
```

These values come from `docs/evidence/contracts/deployment-txs.md`, Git history, and constants in `SettleRWA.sol`.

- [ ] **Step 4: Register and verify**

Insert `tsx src/app/integration-docs.test.ts &&` before the infra page test in `package.json`.

```powershell
npx tsx src/app/integration-docs.test.ts
npm run format:check
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```powershell
git add package.json src/app/integration-docs.test.ts contracts/deployments/cc3-testnet.json
git commit -m "docs(deployment): publish canonical CC3 metadata"
```

### Task 2: Publish generated ABIs and stability policy

**Files:**
- Create: `docs/integration/abis/SettleRWA.json`
- Create: `docs/integration/abis/TestRWA.json`
- Create: `docs/integration/abis/PaymentVerifierUSC.json`
- Create: `docs/integration/ABI-STABILITY.md`
- Modify: `src/app/integration-docs.test.ts`

- [ ] **Step 1: Add a failing ABI identity test**

```ts
test("published integration ABIs match generated public artifacts", async () => {
  for (const name of ["SettleRWA", "TestRWA", "PaymentVerifierUSC"]) {
    const generated = JSON.parse(
      await readFile(new URL(`public/abi/${name}.json`, root), "utf8"),
    );
    const published = JSON.parse(
      await readFile(new URL(`docs/integration/abis/${name}.json`, root), "utf8"),
    );
    assert.deepEqual(published, generated);
  }
});
```

- [ ] **Step 2: Verify red**

Run: `npx tsx src/app/integration-docs.test.ts`

Expected: FAIL with `ENOENT`.

- [ ] **Step 3: Copy artifacts mechanically**

```powershell
New-Item -ItemType Directory -Force docs/integration/abis
Copy-Item public/abi/SettleRWA.json docs/integration/abis/SettleRWA.json
Copy-Item public/abi/TestRWA.json docs/integration/abis/TestRWA.json
Copy-Item public/abi/PaymentVerifierUSC.json docs/integration/abis/PaymentVerifierUSC.json
```

Never hand-edit these copies.

- [ ] **Step 4: Create `ABI-STABILITY.md`**

Use this exact policy:

```markdown
# ABI stability

These files mirror compiler-generated ABIs used by the current CC3 testnet
deployment. They are not a mainnet or permanent semantic-versioning promise.

## Integrator surface

- `createSale`, `getSale`, `reclaim`, `paymentTuple`
- `sellerNonces`, `activeSaleForPaymentTuple`
- `SaleCreated`, `AssetEscrowed`, `SaleSettled`, `AssetReclaimed`
- `PaymentProofAccepted`

## Administrative surface

Asset/source/verifier configuration, role management, and pause controls are
operator functions. They are not part of the application integration contract.

A future incompatible deployment receives a new manifest version; existing ABI
files remain associated with the deployment documented here.
```

- [ ] **Step 5: Verify and commit**

```powershell
npx tsx src/app/integration-docs.test.ts
git add docs/integration/abis docs/integration/ABI-STABILITY.md src/app/integration-docs.test.ts
git commit -m "docs(integration): publish generated contract ABIs"
```

Expected: identity test passes.

### Task 3: Publish the `createSale` parameter specification

**Files:**
- Create: `docs/integration/PARAM-SPEC.md`
- Modify: `src/app/integration-docs.test.ts`

- [ ] **Step 1: Add failing content assertions**

Add a test that requires all exact argument names:

```ts
const argumentsInOrder = [
  "buyer", "assetContract", "tokenId", "assetAmount", "paymentChainKey",
  "paymentChainId", "paymentToken", "paymentRecipient", "paymentAmount",
  "sourceStartBlock", "sourceEndBlock",
];
```

It must also require `chainKey is not chainId`, `Do not use JavaScript number`, official Sepolia USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`, `50,000`, and `24 hours`.

- [ ] **Step 2: Verify red**

Run: `npx tsx src/app/integration-docs.test.ts`

Expected: FAIL because `PARAM-SPEC.md` is absent.

- [ ] **Step 3: Extract exact source rules**

```powershell
rg -n "function createSale|error |MAX_WINDOW|MIN_RECLAIM_DELAY|paymentChainKey|paymentAmount|sourceStartBlock|sourceEndBlock" contracts/src/SettleRWA.sol
Get-Content -Raw src/lib/schemas.ts
```

- [ ] **Step 4: Write `PARAM-SPEC.md`**

Include:

1. Exact 11-argument Solidity signature.
2. Table: argument, Solidity/JSON type, unit, validation, custom error.
3. Cross-field rules: chain key versus chain ID, tuple uniqueness, private buyer, allowlists, and block window.
4. Valid JSON using decimal strings and raw six-decimal USDC.
5. Error table labeled user-correctable or operator-correctable.
6. Warning that payment is irreversible and settlement is not an atomic two-chain swap.

The text must say exactly:

```text
chainKey is not chainId: Sepolia uses Attestcoin chain key 1 and EVM chain ID 11155111.
Do not use JavaScript number for uint256 values; use decimal strings or bigint.
```

- [ ] **Step 5: Verify and commit**

```powershell
npx tsx src/app/integration-docs.test.ts
npm run format:check
git add docs/integration/PARAM-SPEC.md src/app/integration-docs.test.ts
git commit -m "docs(integration): specify createSale parameters"
```

### Task 4: Publish the canonical integration guide

**Files:**
- Create: `docs/integration/README.md`
- Modify: `README.md`
- Modify: `src/app/infra/page.tsx`
- Modify: `src/app/integration-docs.test.ts`

- [ ] **Step 1: Add failing guide tests**

Require implemented routes:

```text
/api/v1/sales/prepare
/api/v1/sales/index
/api/v1/sales/:saleId/payment
/api/v1/sales/:saleId/settlement
```

Assert the guide does not contain `POST /api/v1/sales`. Assert README links to `docs/integration/README.md`, and `/infra` contains `Repository integration guide`.

- [ ] **Step 2: Verify red**

Run: `npx tsx src/app/integration-docs.test.ts`

Expected: FAIL because the guide and entry links are absent.

- [ ] **Step 3: Write the integration sequence**

Use this exact order:

```text
0. Read the canonical CC3 manifest.
1. Complete curated ERC-1155 asset onboarding.
2. Approve SettleRWA for the seller's ERC-1155.
3. Authenticate and prepare, or directly create, the sale.
4. Index the successful SaleCreated transaction when using the API.
5. Buyer transfers the exact official Sepolia test USDC amount.
6. Register the source transaction once.
7. Poll combined settlement state or index contract events.
8. Preserve the recovery URL while Attestcoin builds the proof.
```

Include a copy-ready viem example using `parseAbi`, `bigint`, manifest addresses, and arguments in exact order. Explain worker trust boundary, 8–10 minute attestation, curated onboarding, and non-atomic settlement.

- [ ] **Step 4: Add entry links**

Add `Developer integration` to README's top links. Add one concise callout in `/infra` linking to the GitHub path for `docs/integration/README.md`; do not duplicate the guide body.

- [ ] **Step 5: Verify**

```powershell
npx tsx src/app/integration-docs.test.ts
npx tsx src/app/infra/page.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: all exit 0.

- [ ] **Step 6: Commit**

```powershell
git add docs/integration/README.md README.md src/app/infra/page.tsx src/app/integration-docs.test.ts
git commit -m "docs(integration): publish builder quickstart"
```

### Task 5: Verify the integration workstream

**Files:**
- Modify: `docs/PROGRESS.md` after acquiring its lock

- [ ] **Step 1: Cross-check addresses**

Load the manifest and confirm every current address in README, `/infra`, and integration docs matches it. Historical transaction addresses must be labeled historical rather than canonical.

- [ ] **Step 2: Run full checks**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Expected: all exit 0.

- [ ] **Step 3: Record remaining limitations**

Record that `deployment.verified` remains false until Blockscout source verification is actually completed.

- [ ] **Step 4: Commit**

```powershell
git add docs/PROGRESS.md
git commit -m "docs(progress): verify developer integration package"
```
