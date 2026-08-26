# SettleRWA Protocol-Core Design

## Goal

Deliver the smallest deployable SettleRWA MVP that proves the settlement logic before UI polish. The application will deploy to Vercel as one Next.js project.

## Architecture

- A single Next.js App Router application hosts the future UI and minimal route handlers.
- Pure TypeScript domain modules implement sale preparation, payment matching, replay protection, and the worker state machine. These modules do not depend on React or HTTP.
- Solidity contracts implement the authoritative RWA, escrow, and verified-settlement rules.
- Route handlers expose domain state for the UI but never authorize an on-chain settlement.
- In-memory demo storage is acceptable for the first local slice. Persistent PostgreSQL storage is added only when live worker execution needs restart recovery.

## Core Flow

1. A seller escrows one ERC-1155 asset for a predefined buyer.
2. The sale records the Sepolia chain key, official test USDC address, payer, recipient, exact amount, and source block window.
3. A submitted payment observation is checked against every recorded field.
4. A verified, successful payment can settle an open sale once.
5. The asset moves from escrow to the predefined buyer and the proof/query identifier becomes unusable.

## Security Boundaries

- Contracts remain the source of truth.
- The Next.js server and worker can discover and submit evidence but cannot bypass proof validation.
- Settlement rejects a failed receipt, wrong chain, token, payer, recipient, amount, block window, duplicate query, or non-open sale.
- Replay marking and asset release occur in one transaction so a reverted transfer does not consume the proof.

## Initial Deliverable

- Next.js TypeScript project configured for Vercel.
- Pure domain logic with one focused runnable test suite.
- Minimal API routes exposing demo sale creation, payment submission, and settlement status.
- Solidity contract source and focused Foundry tests where the local toolchain permits execution.
- A minimal functional page showing the product narrative and current settlement stages; visual polish is deferred.
- README with local commands, trust model, limitations, and the path to live Attestcoin integration.

## Deliberate Deferrals

- Live Attestcoin/USC proof construction, wallet signatures, testnet deployment, PostgreSQL, SIWE, and persistent jobs require credentials or external infrastructure and are not prerequisites for validating local domain logic.
- Open marketplace, auctions, partial fills, KYC, smart accounts, bridges, and production RWA issuance remain out of scope.

## Verification

- Type checking and production build must pass.
- Tests cover successful settlement plus wrong chain, token, payer, recipient, amount, block range, failed receipt, already-settled sale, and replay.
- Contract tests cover escrow authorization and one-time settlement when Foundry is available.
