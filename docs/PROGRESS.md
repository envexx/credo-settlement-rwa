# Project progress

## 30 August 2026 — three-day product increment

Inspected:

- Repository state, architecture and audit notes, product requirements, current
  progress, deployment evidence, recent commits, and the complete test surface.
- Next.js 16.3.3 repository guidance before implementation.

Completed:

- [x] Unified settlement status language across the playground and recovery
      route, including pre-payment guidance and a durable recovery URL.
- [x] Added live recovery polling and removed misleading payment guidance when
      settlement data is unavailable.
- [x] Added an accessible mobile navigation dialog.
- [x] Published canonical deployment metadata, generated ABIs, parameter
      semantics, builder quickstart, evidence index, and submission QA contract.
- [x] Added regression coverage for status presentation, integration artifacts,
      evidence links, responsive navigation, and recovery behavior.

Verification:

- [x] `npm test`: PASS — 40 tests.
- [x] `npm run typecheck`: PASS.
- [x] `npm run lint`: PASS with zero warnings.
- [x] `npm run format:check`: PASS.
- [x] `npm run build`: PASS with Next.js 16.3.3.
- [x] Browser smoke test at 375×812: landing, playground, infrastructure docs,
      and recovery route render without horizontal overflow.
- [x] Keyboard skip link and mobile menu Escape/focus restoration verified.
- [x] Missing-sale recovery state verified without contradictory payment advice.

Remaining:

- Complete the unchecked larger-viewport, screen-reader, and live-wallet demo
  rehearsal items in `docs/QA-CHECKLIST.md`.
- Verify the real recovery route using the sale ID produced during rehearsal.

Blockers: none. User approval required: no for this presentation and
documentation increment.

## 30 August 2026 — three-day sprint baseline

- Branch and commit: `main` at `dee0d328f7ff34767485a03141607f4e27f93380`.
- Preserved user changes: replacement of the professional PDF deck.
- `npm test`: PASS — 28 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with zero warnings.
- `npm run format:check`: PASS.
- `npm run build`: PASS with Next.js 16.3.3; all expected application and API
  routes compiled.

## 29 August 2026 — keyboard navigation

Inspected:

- Repository status and five most recent commits.
- README, architecture/audit documents, UI/UX blueprint, and Next.js 16.3.3
  accessibility guidance.
- Shared navigation, all four product routes, global styles, existing tests,
  and package verification scripts.

Completed:

- [x] Add a shared “Skip to main content” link to bypass the sticky header.
- [x] Add a stable, programmatically focusable main target to the landing,
      playground, developer docs, and transaction recovery routes.
- [x] Add regression coverage for the shared link and every destination.

Verification:

- [x] Focused regression test (5/5 pass after the initial red run).
- [x] Full test suite (26/26 pass).
- [x] Type check (clean).
- [x] ESLint with zero warnings (clean).
- [x] Prettier check (clean).
- [x] Production build (Next.js 16.3.3, all routes compiled).

Remaining:

- Run a browser-based keyboard and screen-reader pass across the interactive
  playground states.
- Verify contract source and negative proof cases on public explorers; these
  require live-chain work and are outside this presentation-only increment.

Blockers: none. User approval required: no.
