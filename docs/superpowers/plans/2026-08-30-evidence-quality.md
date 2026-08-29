# Credo Evidence and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Credo's settlement claim independently verifiable and establish repeatable technical and manual quality gates.

**Architecture:** Index existing immutable evidence instead of rewriting it, protect local artifacts and link shapes with a Node test, and execute a manual QA matrix for accessibility, responsiveness, recovery, and demo rehearsal. This agent verifies other workstreams but reports product defects to their owners.

**Tech Stack:** Markdown, JSON, TypeScript, Node test runner, Next.js build tooling, browser QA

---

## File map

- Create `docs/evidence/README.md`: ordered evidence narrative.
- Create `src/app/evidence-links.test.ts`: artifact and link validation.
- Create `docs/QA-CHECKLIST.md`: manual quality matrix.
- Modify `src/app/page.tsx`: evidence link labels only.
- Modify `package.json`: include evidence validation.
- Modify `docs/PROGRESS.md`: observed results and release candidate.

### Task 1: Define the evidence contract

**Files:**
- Create: `src/app/evidence-links.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
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
  const index = await readFile(new URL("docs/evidence/README.md", root), "utf8");
  for (const path of required) {
    await access(new URL(path, root));
    assert.match(index, new RegExp(path.replace("docs/evidence/", "")));
  }
  assert.match(index, /Sepolia payment/);
  assert.match(index, /Attestcoin proof/);
  assert.match(index, /Creditcoin settlement/);
  assert.match(index, /replay marker/i);
  assert.match(index, /not an atomic/i);
});
```

- [ ] **Step 2: Verify red**

Run: `npx tsx src/app/evidence-links.test.ts`

Expected: FAIL because `docs/evidence/README.md` is absent.

- [ ] **Step 3: Register the test**

Insert `tsx src/app/evidence-links.test.ts &&` before the product-copy test in `package.json`.

- [ ] **Step 4: Commit the test**

```powershell
git add package.json src/app/evidence-links.test.ts
git commit -m "test(evidence): define public proof contract"
```

The red test must be followed immediately by Task 2 before integration.

### Task 2: Publish the public evidence narrative

**Files:**
- Create: `docs/evidence/README.md`
- Modify: `src/app/page.tsx`
- Test: `src/app/evidence-links.test.ts`

- [ ] **Step 1: Read immutable evidence**

```powershell
Get-Content -Raw docs/evidence/payment/sepolia-tx.json
Get-Content -Raw docs/evidence/attestcoin/proof-run.json
Get-Content -Raw docs/evidence/settlement/creditcoin-tx.json
Get-Content -Raw docs/evidence/rwa/before.json
Get-Content -Raw docs/evidence/rwa/after.json
Get-Content -Raw docs/evidence/contracts/addresses.json
```

Record exact hashes, query ID, balances, replay state, and latency. Do not edit these source artifacts.

- [ ] **Step 2: Create the index in fixed order**

`docs/evidence/README.md` must present:

1. Canonical deployed addresses.
2. Buyer Sepolia payment.
3. Attestcoin proof and query ID.
4. Creditcoin CC3 settlement.
5. Before/after buyer and escrow balances.
6. Consumed replay marker.
7. Limitations: testnet, curated onboarding, 8–10 minute attestation, and not an atomic two-chain swap.

Each stage includes its local artifact link and existing public explorer URL. Use labels `View Sepolia payment` and `View Creditcoin settlement`, never `View transaction`.

- [ ] **Step 3: Improve landing link labels**

Preserve existing URLs and change visible copy to:

```text
View payment on Sepolia
View settlement on Creditcoin CC3
```

- [ ] **Step 4: Verify green**

```powershell
npx tsx src/app/evidence-links.test.ts
npx tsx src/app/product-copy.test.ts
```

Expected: both pass.

- [ ] **Step 5: Commit**

```powershell
git add docs/evidence/README.md src/app/page.tsx
git commit -m "docs(evidence): explain live settlement proof"
```

### Task 3: Strengthen evidence validation

**Files:**
- Modify: `src/app/evidence-links.test.ts`

- [ ] **Step 1: Add exact hash and domain tests**

Parse the payment and settlement JSON. Assert transaction hashes match:

```ts
/^0x[0-9a-fA-F]{64}$/
```

Extract HTTP links from the evidence index and assert every explorer link uses one of:

```ts
const allowedHosts = new Set([
  "sepolia.etherscan.io",
  "creditcoin-testnet.blockscout.com",
]);
```

- [ ] **Step 2: Run local validation**

Run: `npx tsx src/app/evidence-links.test.ts`

Expected: all tests pass.

- [ ] **Step 3: Check URLs read-only**

Make an unauthenticated HEAD or GET request to each public URL and record its HTTP status. Rate limiting is recorded as a blocker, not treated as success.

- [ ] **Step 4: Commit**

```powershell
git add src/app/evidence-links.test.ts
git commit -m "test(evidence): validate explorer references"
```

### Task 4: Create the manual QA matrix

**Files:**
- Create: `docs/QA-CHECKLIST.md`

- [ ] **Step 1: Create execution metadata**

Start with fields for tester, date/time, commit, browser/version, operating system, and observed blockers.

- [ ] **Step 2: Add the viewport matrix**

```markdown
## Viewports

| Route | 375×812 | 768×1024 | 1440×900 | Horizontal overflow |
|---|---|---|---|---|
| `/` | [ ] | [ ] | [ ] | [ ] none |
| `/infra` | [ ] | [ ] | [ ] | [ ] none |
| `/playground` | [ ] | [ ] | [ ] | [ ] none |
| Transaction recovery route | [ ] | [ ] | [ ] | [ ] none |
```

Execute the transaction row using the real sale ID created for the rehearsal.

- [ ] **Step 3: Add keyboard/accessibility checks**

```markdown
- [ ] First Tab reveals “Skip to main content”.
- [ ] Enter moves focus to the main landmark.
- [ ] Desktop dropdowns work without a pointer.
- [ ] Mobile navigation traps/restores focus and closes with Escape.
- [ ] Accordions expose expanded state.
- [ ] Status never depends on color alone.
- [ ] Progress is polite and unchanged polling is not announced.
- [ ] Reduced-motion mode removes nonessential animation.
```

- [ ] **Step 4: Add recovery/error checks**

```markdown
- [ ] Open sale reloads without a second reservation.
- [ ] Recovery URL works in a new tab.
- [ ] Waiting proof explains the 8–10 minute delay.
- [ ] Retryable failure says no second payment is required.
- [ ] Permanent rejection provides one next action.
- [ ] Full hashes remain available to copy or inspect.
```

- [ ] **Step 5: Add rehearsal checks**

```markdown
- [ ] Start from a clean browser session.
- [ ] Connect the intended wallet and confirm network guidance.
- [ ] Reserve one RWA and preserve the sale ID.
- [ ] Show exact payment instructions before payment.
- [ ] Explain the Attestcoin waiting period.
- [ ] Open the recovery URL.
- [ ] Show verified historical evidence if live proof is pending.
- [ ] End on Creditcoin ownership and replay evidence.
```

- [ ] **Step 6: Commit**

```powershell
git add docs/QA-CHECKLIST.md
git commit -m "docs(qa): define submission quality matrix"
```

### Task 5: Execute cross-workstream QA

**Files:**
- Modify: `docs/QA-CHECKLIST.md`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Run fresh automated checks**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Expected: all exit 0. Record exact test count and build routes.

- [ ] **Step 2: Execute every manual row**

Use a production build where possible. Mark a row only after observing it. Record each failure as:

```text
FAIL — route — viewport — reproduction — expected — observed — owner
```

- [ ] **Step 3: Re-test fixes independently**

For each owner fix, run its focused test and repeat the exact manual scenario. Do not accept an agent report as verification.

- [ ] **Step 4: Commit observed evidence**

```powershell
git add docs/QA-CHECKLIST.md docs/PROGRESS.md
git commit -m "docs(qa): record submission verification"
```

### Task 6: Rehearse and freeze

**Files:**
- Modify: `docs/QA-CHECKLIST.md`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Rehearse the live path**

From a clean session: connect, reserve, preserve sale ID, display payment terms, pay, open recovery, and monitor proof. Record stage timings.

- [ ] **Step 2: Rehearse the fallback path**

If live proof is pending, explicitly transition to historical evidence. Never imply historical evidence belongs to the current sale.

- [ ] **Step 3: Run final verification again**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
git diff --check origin/main...HEAD
```

Expected: all exit 0.

- [ ] **Step 4: Record release candidate and commit**

Record commit, exact results, rehearsal duration, known limitations, and approval requirements.

```powershell
git add docs/QA-CHECKLIST.md docs/PROGRESS.md
git commit -m "docs(submission): record final demo rehearsal"
```

Expected: final commit contains documentation evidence only.
