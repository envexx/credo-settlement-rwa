# Submission QA checklist

- Tester: Codex automated checks and agent-browser smoke test
- Date: 30 August 2026
- Release commit: recorded after final verification
- Browser/version: Chromium via agent-browser
- Operating system: Windows
- Blockers: none in automated baseline

## Viewports

| Route | 375×812 | 768×1024 | 1440×900 | Horizontal overflow |
|---|---|---|---|---|
| `/` | [x] | [ ] | [ ] | [x] none |
| `/infra` | [x] | [ ] | [ ] | [x] none |
| `/playground` | [x] | [ ] | [ ] | [x] none |
| Transaction recovery route | [x] | [ ] | [ ] | [x] none |

Execute the transaction row using the real sale ID created for rehearsal.

## Keyboard and accessibility

- [x] First Tab reveals “Skip to main content”.
- [x] Enter moves focus to the main landmark.
- [ ] Desktop dropdowns work without a pointer.
- [x] Mobile navigation restores focus and closes with Escape.
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

## 30 August browser observations

- All four routes rendered at 375×812 without horizontal overflow.
- The mobile navigation opened as a labelled dialog and closed with Escape;
  focus returned to its trigger button.
- The skip link moved keyboard focus to `main-content`.
- A missing historical sale showed retry guidance and no longer displayed the
  contradictory “Ready for payment” state.
- Live wallet payment, real-sale recovery, screen-reader output, and the larger
  viewport matrix remain intentionally unchecked until manually rehearsed.
