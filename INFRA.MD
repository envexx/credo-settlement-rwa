# SettleRWA Infrastructure

SettleRWA is a proof-triggered settlement primitive for RWA delivery versus payment. Official USDC stays final on Ethereum Sepolia, the ERC-1155 asset stays on Creditcoin CC3, and only an Attestcoin inclusion and continuity proof crosses chains.

> Worker discovers. Attestcoin proves. Contract decides.

## Active deployment

| Contract | Creditcoin CC3 address |
|---|---|
| SettleRWA | `0x643e070304b7ae9Eed815A7976AA83217206b64a` |
| PaymentVerifierUSC | `0x89df0af9C61D9636d1f67748D863f9AfC741EcfF` |
| TestRWA | `0xEe1e1D277d011157dAC95F59189E9d5877668284` |
| EvmV1Decoder | `0xd2705324FD6D54e33789768a636039811B47BA3f` |

- Creditcoin chain ID: `102031`
- Sepolia EVM chain ID: `11155111`
- Sepolia Attestcoin chain key: `1`
- Official Sepolia USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- Native Query Verifier: `0x0000000000000000000000000000000000000FD2`

## Integration path

1. Read and independently verify the deployment manifest.
2. Have the ERC-1155 asset added to the curated asset allowlist.
3. Approve `SettleRWA` as ERC-1155 operator.
4. Call `createSale` with the designated Buyer, exact payment tuple, and source block window.
5. Index `SaleCreated`; everything after the Buyer payment is automatic.

## Sale lifecycle

```text
OPEN
  → Buyer transfers exact official USDC on Sepolia
  → Worker validates the successful receipt locally
  → Attestcoin attests the source block and builds a proof
  → PaymentVerifierUSC verifies inclusion and the exact Transfer log
  → SettleRWA releases escrow to the designated Buyer
SETTLED
```

## Payment matching

The verified receipt must match every field exactly: successful receipt, chain key, token emitter, payer, recipient, amount, block window, and a globally unused query ID.

## Protocol limits

| Limit | Value |
|---|---|
| Maximum source window | 50,000 blocks |
| Reclaim safety grace | 24 hours after estimated source window duration |
| Estimated source block time | 12 seconds |
| Observed v3 latency | 489 seconds |

## Recovery

The payment transaction hash is persisted server-side. Closing the browser does not cancel settlement. A stale worker job is reclaimed after 60 seconds. The UI must never request a second payment once a source transaction is registered.

## Explicit non-goals

- No asset bridge or wrapped USDC.
- No trusted worker authorization.
- No immediate Seller cancellation.
- No claim of a simultaneous two-chain atomic swap.
- No production-value guarantee for this testnet deployment.

## Public evidence

- [Sepolia payment](https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010)
- [Creditcoin settlement](https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96)
- [Threat model](docs/threat-model/README.md)
- [TDD audit](docs/TDD-AUDIT.md)
