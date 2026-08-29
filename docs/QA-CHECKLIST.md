# Submission QA checklist

- Tester: Codex automated checks; manual browser tester not yet recorded
- Date: 30 August 2026
- Release commit: recorded after final verification
- Browser/version: pending manual execution
- Operating system: Windows
- Blockers: none in automated baseline

## Viewports

| Route | 375×812 | 768×1024 | 1440×900 | Horizontal overflow |
|---|---|---|---|---|
| `/` | [ ] | [ ] | [ ] | [ ] none |
| `/infra` | [ ] | [ ] | [ ] | [ ] none |
| `/playground` | [ ] | [ ] | [ ] | [ ] none |
| Transaction recovery route | [ ] | [ ] | [ ] | [ ] none |

Execute the transaction row using the real sale ID created for rehearsal.

## Keyboard and accessibility

- [ ] First Tab reveals “Skip to main content”.
- [ ] Enter moves focus to the main landmark.
- [ ] Desktop dropdowns work without a pointer.
- [ ] Mobile navigation traps and restores focus and closes with Escape.
- [ ] Accordions expose expanded state.
- [ ] Status never depends on color alone.
- [ ] Progress is polite and unchanged polling is not announced.
- [ ] Reduced-motion mode removes nonessential animation.

## Recovery and error guidance

- [ ] Open sale reloads without a second reservation.
- [ ] Recovery URL works in a new tab.
- [ ] Waiting proof explains the 8–10 minute delay.
- [ ] Retryable failure says no second payment is required.
- [ ] Permanent rejection provides one next action.
- [ ] Full hashes remain available to copy or inspect.

## Demo rehearsal

- [ ] Start from a clean browser session.
- [ ] Connect the intended wallet and confirm network guidance.
- [ ] Reserve one RWA and preserve the sale ID.
- [ ] Show exact payment instructions before payment.
- [ ] Explain the Attestcoin waiting period.
- [ ] Open the recovery URL.
- [ ] Show verified historical evidence if live proof is pending.
- [ ] End on Creditcoin ownership and replay evidence.

## Failure record format

Record each observed failure with route, viewport, reproduction steps, expected
behavior, observed behavior, and owner. Never mark an unobserved row as passed.
