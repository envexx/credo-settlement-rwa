# SettleRWA threat model

The only settlement authority is a proof accepted by Creditcoin's native verifier and decoded by `PaymentVerifierUSC`.

| Threat | Enforcement |
|---|---|
| Fake token or event | Exact log emitter and `Transfer` signature |
| Wrong payer/recipient/value | Values decoded from the verified receipt and matched exactly |
| Failed source transaction | Receipt status must equal `1` |
| Old payment | Source block must be inside the sale window |
| Proof replay | Global `(chainKey, blockHeight, txIndex)` query ID |
| One payment settles two identical sales | Active payment-tuple reservation |
| Compromised worker | Submission is permissionless; worker provides no trusted fields |
| Malicious admin | No force-settle or active-escrow withdrawal function; verifier is set once |
| Seller cancels after payment | No immediate cancellation; minimum 24-hour proof grace period |

The payment and asset release are not one two-chain atomic transaction. This MVP is proof-triggered settlement after an irreversible source-chain payment.
