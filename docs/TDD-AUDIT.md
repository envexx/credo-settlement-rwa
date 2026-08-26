# TDD implementation audit — 26 August 2026

## Re-audit session 4 — developer documentation alignment

The developer documentation was checked against the live route handlers,
Solidity contracts, deployment manifest, worker statuses, and threat model.

| Check | Result |
|---|---|
| `npm test` (protocol + store + RPC + worker + docs regression suites) | 19/19 pass |
| `tsc --noEmit`, ESLint `--max-warnings=0` | clean |
| Prettier | clean |
| `next build` | success; `/infra` prerendered and every documented v1 route present |
| Browser verification | one instance of all 12 sections; no console warnings or errors |

Documentation corrections completed in this session:

1. Replaced the invalid `POST /api/v1/sales` path with the implemented
   `POST /api/v1/sales/index` route.
2. Moved proof/error polling to `GET /api/v1/sales/:saleId/settlement` and
   separated sale statuses from payment/proof statuses.
3. Corrected the flat 11-argument `createSale` signature and the actual
   `SaleSettled` event fields.
4. Added buyer authentication, ordered argument encoding, complete parameter
   rules, official Sepolia USDC, deployment transaction links, and explicit
   API-assisted versus direct-contract guidance.
5. Added the compiler-generated `TestRWA` ABI and a regression suite that locks
   the executable documentation contract.
6. Made curated asset onboarding, non-atomic settlement, worker trust limits,
   and pending Blockscout source publication explicit.

Foundry was not re-executed in session 4 because `forge` is not available in
this host's `PATH`; the session 3 Foundry evidence below remains the latest
recorded execution.

## Re-audit session 3 (26 Aug 2026)

Every claim below was re-executed locally during this audit, not taken on trust.

| Check | Result |
|---|---|
| `npm test` (settlement + store + RPC + worker suites) | 16/16 pass |
| `forge test` (unit, 256-run fuzz, and invariants) | 9/9 pass |
| `tsc --noEmit`, ESLint `--max-warnings=0` | clean |
| Prettier / `forge fmt --check` | clean |
| `next build` | success, all v1 routes present |
| Active v3 deployment verification via CC3 RPC | all four bytecodes present; verifier binding and allowlists correct |
| Active v3 end-to-end settlement | distinct Buyer/Seller; status = 2; Buyer balance = 1; escrow = 0; replay marker = true |

Fixes applied this session:

1. `worker/live.ts`: two implicit-any parameters typed (`Log` from ethers) — typecheck now fully green.
2. Stale `.next/types` referenced a deleted `sales/index` route; `.next` cleared.
3. `contracts/src/SettleRWA.sol` reformatted with `forge fmt` (CI runs `forge fmt --check`).
4. **Hardened the sale indexer** `POST /api/v1/sales/index` (TDD §Phase 6): accepts only `saleId` and `creationTxHash`, verifies the successful CC3 receipt and its `SaleCreated` event, checks the authenticated Seller, and rebuilds the row from `SettleRWA.getSale()`. Browser-submitted sale parameters are no longer trusted.
5. Corrected reclaim timing to cover the complete source payment window plus a 24-hour safety grace period.
6. Added worker heartbeat/recovery for stale intermediate jobs, made pending source transactions retryable, persisted `queryId`, reconciled successful settlement against CC3 state, and added a safe gas-estimation fallback.
7. Prevented one source transaction hash from being assigned to multiple sales and added the corresponding store test.
8. Added primary/fallback Creditcoin RPC support and tests for single-provider and priority-failover configuration.
9. Added deterministic stale-job recovery policy and restart simulation coverage.
10. Added two Foundry custody invariants; 256 runs and 256,000 handler calls completed without asset duplication or loss.
11. Ran Slither across 27 contracts and resolved its reentrancy finding with `ReentrancyGuard` plus checks-effects-interactions ordering. The only remaining informational result is the intentional reclaim timestamp comparison.

## Completed locally

| TDD area | Evidence |
|---|---|
| ERC-1155 demo RWA, issuer role, immutable metadata hash | `contracts/src/TestRWA.sol`, `contracts/metadata/1001.json` |
| Escrow, private buyer, payment tuple, allowlists, pause-new-sales, reclaim | `contracts/src/SettleRWA.sol` |
| USC v2 native verifier, receipt decoding, exact Transfer match, replay | `contracts/src/PaymentVerifierUSC.sol` |
| Source chain key distinct from EVM chain ID | contract config, `.env.example`, deployment script |
| SIWE-style auth and secure session | `/api/v1/auth/*`, PostgreSQL nonce consumption |
| Sale/payment/settlement APIs and error contract | `/api/v1/sales/*`, `src/lib/http.ts` |
| Database model and append-only audit events | `db/migrations/0001_initial.sql` |
| Persistent worker, local receipt validation, proof generation/submission, retry/recovery | `worker/` |
| Deployment and demo seed | `contracts/script/deploy.ts` |
| CI, strict TypeScript, security headers, body/origin/rate checks | `.github/workflows`, `tsconfig.json`, `next.config.ts`, `src/lib/security.ts` |
| Threat model and evidence layout | `docs/threat-model`, `docs/evidence` |

## Verified

- CC3 public RPC returned chain ID `0x18e8f` (`102031`).
- Proof Builder endpoint returned HTTP 200.
- Solidity 0.8.30 compilation passed.
- Foundry: 9/9 contract tests passed, including 256 fuzz runs and two 256-run invariant properties.
- TypeScript: 16/16 domain/store/RPC/worker tests passed.
- Type-check, production Next.js build, and production dependency audit passed.
- Active v3 `TestRWA`, `SettleRWA`, `EvmV1Decoder`, and `PaymentVerifierUSC` deployed and verified through CC3 RPC.
- A distinct Buyer paid 5 official Sepolia USDC at block `11,566,178` to the Seller.
- Attestcoin proof accepted with query ID `0x4c94e8b1…d853e655` after 489 seconds.
- Active v3 settlement succeeded; sale status is `SETTLED`, replay marker is true, escrow balance is zero, and the distinct Buyer balance is one.

## Open gates before the complete TDD Definition of Done

Remaining live-chain evidence:

- Verify contract source on Blockscout.
- Execute explorer-backed negative proof transactions for wrong amount, wrong recipient, replay, failed source transaction, wrong chain/token, and wrong sale.

Phase 0–6 business logic and the four local Phase 8 gates pass. The TDD as a whole is **not yet complete**: Phase 7 UI, explorer-backed negative proof evidence, contract source verification, and final Phase 9 presentation evidence remain open.
