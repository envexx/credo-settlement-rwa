# Credo three-day product roadmap design

- **Status:** Approved design
- **Date:** 30 August 2026
- **Timebox:** Three days
- **Capacity:** Three parallel agents
**Strategy:** Three workstreams, one product story

## 1. Purpose

This sprint prepares Credo for a strong hackathon demonstration without
discarding work needed for the product's next stage.

The shared product story is:

> Credo is easy to try, easy to verify, and practical for another developer to
> integrate.

The sprint prioritizes demo reliability, clear product communication, public
technical evidence, and integration readiness. It does not change Credo's core
settlement behavior.

## 2. Success criteria

At the end of the sprint:

1. A first-time visitor can understand the settlement flow and current state
   without developer assistance.
2. A failed or blocked playground step explains both the problem and the next
   action.
3. A user can leave the browser during proof generation and recover the sale.
4. The primary product routes work on mobile and with keyboard navigation.
5. A developer can identify the canonical deployment, understand `createSale`,
   obtain the compiled ABIs, and follow a complete integration sequence.
6. A reviewer can independently inspect the payment, proof, contract, and
   settlement evidence.
7. Tests, type checking, lint, formatting, and the production build pass before
   the submission version is frozen.

## 3. Scope boundaries

### In scope

- UI, UX, copy, navigation, accessibility, and responsive behavior.
- Playground state presentation and recovery using existing contracts and APIs.
- Developer documentation, compiled ABI publication, and deployment metadata.
- Test coverage, quality assurance, evidence organization, and demo rehearsal.

### Out of scope

- Smart-contract behavior or redeployment.
- Payment semantics or blockchain settlement rules.
- Authentication or authorization changes.
- Database-model or public-API contract changes.
- Mainnet launch, multi-chain support, SDK publication, or a public subgraph.

If an in-scope investigation reveals that a core change is required, work stops
at a Technical Design Document. Implementation requires explicit user approval.

## 4. Priority model

### P0 — Demo-critical

These items take precedence over all other work.

#### P0.1 Playground state clarity

**Change:** Present one understandable lifecycle across preparation,
reservation, payment, proof waiting, settlement, retry, rejection, and failure.

**Impact:** Users know whether the system is working, waiting, blocked, or
finished. A long attestation delay no longer looks like a frozen application.

**Acceptance criteria:**

- Every reachable state has a human-readable title and explanation.
- Every nonterminal state says what is happening next.
- Every blocked or failed state provides one recommended user action.
- Status terminology is consistent between the playground and recovery page.

#### P0.2 Preflight guidance

**Change:** Surface existing wallet, network, test-balance, and service
requirements before the irreversible payment step.

**Impact:** Preventable setup problems are found before they can break a live
demo.

**Acceptance criteria:**

- The required wallet and networks are named in plain language.
- Missing prerequisites explain how the user can resolve them.
- No new authorization, payment rule, or server trust decision is introduced.

#### P0.3 Recovery continuity

**Change:** Make the existing sale identifier and transaction recovery route
prominent, persistent, and easy to reopen.

**Impact:** Users can safely leave during the typical 8–10 minute proof window.

**Acceptance criteria:**

- A user can copy or revisit the recovery URL after sale creation.
- Reloading or reopening the recovery page presents the latest known state.
- Recovery depends on the existing API and chain state, not browser-only state.

#### P0.4 Mobile navigation

**Change:** Provide access to the core product, documentation, evidence, and
playground links below the current desktop breakpoint.

**Impact:** The complete product remains discoverable on phones and narrow
presentation windows.

**Acceptance criteria:**

- Navigation is operable by touch and keyboard.
- Interactive targets are at least 44 pixels high or wide.
- Opening and closing navigation manages focus correctly.
- No horizontal page overflow is introduced.

#### P0.5 Submission verification

**Change:** Establish a reproducible final verification and rehearsal gate.

**Impact:** The submission is frozen only after technical and presentation
failures have been actively checked.

**Acceptance criteria:**

- Relevant tests, full tests, type check, lint, format check, and production
  build pass.
- The demo script is rehearsed from a clean starting state.
- Any live-network dependency and fallback explanation is recorded.

### P1 — High impact

P1 begins after the relevant P0 risks have a clear owner and implementation.

#### P1.1 Canonical integration guide

**Change:** Document prerequisites and the complete flow from deployment lookup
through sale creation, payment registration, and settlement monitoring.

**Impact:** An external developer can evaluate and begin integrating Credo
without reading internal source files.

**Acceptance criteria:**

- The guide distinguishes API-assisted and direct-contract integration.
- All route names and contract signatures match executable code.
- A copy-ready viem or ethers example uses string or bigint values safely.
- Trust boundaries, recovery, latency, and curated onboarding are explicit.

#### P1.2 `createSale` parameter specification

**Change:** Explain every argument, unit, cross-field rule, and relevant custom
error.

**Impact:** Developers avoid the most likely integration failures: chain-key
confusion, decimal mistakes, invalid block windows, and duplicate tuples.

**Acceptance criteria:**

- Each argument is checked against the deployed Solidity source.
- The distinction between Attestcoin chain key and EVM chain ID is prominent.
- USDC examples use raw six-decimal amounts and avoid JavaScript `number`.
- Cross-field and allowlist requirements are documented.

#### P1.3 ABI and deployment package

**Change:** Publish compiler-generated ABIs and one canonical manifest containing
network identity, addresses, explorer links, deployment transactions, version
information, and protocol limits.

**Impact:** Integrators can use the correct deployment without compiling the
contracts or copying addresses from multiple pages.

**Acceptance criteria:**

- Published ABI files are generated artifacts, not manually rewritten files.
- The manifest and visible product documentation contain matching addresses.
- Explorer links resolve to the intended CC3 deployment or transaction.
- Stable integrator surfaces and admin-only surfaces are clearly separated.

#### P1.4 Evidence narrative

**Change:** Organize existing artifacts into a short sequence: payment,
attestation/proof, settlement, balance transfer, and replay marker.

**Impact:** Reviewers can validate the central claim without trusting marketing
copy.

**Acceptance criteria:**

- Every product claim links to the matching evidence or explorer record.
- Network and action are named in every explorer-link label.
- Limitations are presented beside the success evidence.

### P2 — Medium impact

P2 work is completed only when it does not threaten P0 or P1 completion.

- Browser-based keyboard and screen-reader testing.
- `aria-live` behavior for meaningful progress without repeated polling noise.
- Responsive QA across landing, docs, playground, and recovery routes.
- Consistent status labels, icons, and non-color status indicators.
- Clear transaction hashes, accessible labels, copy actions, and explorer links.
- Recovery-page improvements that do not change API behavior.

**Impact:** The product feels coherent and professional across devices and
assistive technologies.

## 5. Deferred roadmap

### P3 — Valuable after the hackathon

1. Seller dashboard for sales, payments, proofs, settlement, and reclaim.
2. Worker observability for queue age, retries, stale jobs, and health.
3. A second ERC-1155 settlement through the same live settlement contract.
4. A small second integrator application.
5. Contract-source verification on Blockscout.
6. Explorer-backed negative evidence for mismatch, replay, and failed-payment
   cases.

These items turn the demonstration into an operational product and strengthen
the settlement-layer claim, but they must not destabilize the three-day sprint.

### P4 — Low current impact

- Additional decorative animation.
- Dark mode.
- Alternative landing-page layouts.
- A published npm SDK.
- More payment or asset chains.
- A public subgraph or new indexing system.
- Smart-contract redesign.

These may be useful later, but they do not materially improve the three-day
submission outcome. Core or architectural items also require separate design,
risk analysis, and approval.

## 6. Workstream ownership

### Agent 1 — Demo and UX

Owns P0.1–P0.4: playground clarity, guidance, recovery presentation, mobile
navigation, and responsive implementation. This agent must use existing API and
contract behavior as fixed boundaries.

### Agent 2 — Developer integration

Owns P1.1–P1.3: integration guide, parameter specification, generated ABI
package, deployment manifest, and copy-ready integration examples.

### Agent 3 — Evidence and quality

Owns P0.5, P1.4, and P2 validation: baseline checks, accessibility and
responsive QA, evidence review, cross-workstream verification, and demo
rehearsal. This agent reports defects to the owner instead of performing
unrelated rewrites.

## 7. Three-day sequence

### Day 1 — Remove uncertainty

- Agent 1 inventories reachable playground and recovery states, then begins the
  highest-friction P0 changes.
- Agent 2 checks documentation claims against the live source, routes, generated
  ABIs, and deployment manifest.
- Agent 3 records baseline verification, creates the QA matrix, and checks the
  main demo path.
- End-of-day gate: each P0/P1 deliverable has evidence, an owner, and no hidden
  dependency on a core change.

### Day 2 — Complete the shared story

- Agent 1 completes P0 demo and mobile work.
- Agent 2 completes the integration package and cross-checks all addresses and
  signatures.
- Agent 3 tests Agent 1 and Agent 2 outputs, then organizes the evidence story.
- End-of-day gate: feature work is substantially complete; unresolved critical
  issues replace planned P2 work.

### Day 3 — Stabilize and freeze

- No large feature begins on Day 3.
- Owners fix critical and high-severity findings.
- Agent 3 coordinates full verification and a clean demo rehearsal.
- The submission is frozen only when required gates pass or any exception is
  explicitly documented with its mitigation.

## 8. Coordination and integration

- Each agent works on a disjoint file set where practical.
- Shared files require one declared owner; other agents submit findings rather
  than editing concurrently.
- Small coherent commits are preferred over one combined three-day commit.
- Existing user changes are preserved and excluded from unrelated commits.
- Work is integrated in dependency order: shared UX terminology, product UI,
  developer documentation, evidence, then final QA.

## 9. Error-handling principles

- Explain the user-visible problem before displaying technical detail.
- Give one recommended next action.
- Distinguish temporary waiting, retryable failure, permanent rejection, and
  completed settlement.
- Never describe an irreversible payment as reversible or atomic.
- Never hide a failed proof behind a generic loading state.
- Preserve complete hashes and technical errors for inspection and support.

## 10. Verification plan

### Automated

- Focused tests while each increment is developed.
- Full `npm test` at the integration gate.
- `npm run typecheck`.
- `npm run lint`.
- `npm run format:check`.
- `npm run build` using the repository's installed Next.js version.
- Contract tests only if contract-related artifacts are regenerated or touched;
  contract behavior itself remains out of scope.

### Manual

- Desktop and narrow-mobile viewport walkthroughs.
- Keyboard-only navigation and focus-order check.
- Screen-reader check for important progress and terminal errors.
- Recovery from a copied URL and from a browser reload.
- Explorer-link and evidence-link validation.
- Complete demo rehearsal with a documented fallback for live-network delay.

## 11. Cut rules

When time becomes constrained:

1. Preserve demo reliability and recovery first.
2. Finish coherent work before opening another item.
3. Cut P2 before reducing P0 or the essential P1 integration path.
4. Do not start P3 or P4 during the sprint.
5. Do not bypass tests to meet the deadline.
6. Do not make an unapproved core change to rescue a presentation feature.

## 12. Approval requirements

This roadmap is approved for planning. Each implementation increment may proceed
without additional architecture approval when it remains inside the UI,
documentation, evidence, or testing boundaries above.

Explicit user approval remains required before implementing any change to core
business logic, public API contracts, data models, authentication or
authorization, payment behavior, blockchain behavior, migrations, or security
boundaries.
