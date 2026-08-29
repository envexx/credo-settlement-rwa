# Credo live settlement evidence

This index follows one complete settlement with distinct seller and buyer
wallets. Each claim can be checked against a local artifact and public explorer.

## 1. Canonical contracts

The active deployment addresses and source-chain configuration are recorded in
[`contracts/addresses.json`](contracts/addresses.json). The deployment targets
Creditcoin CC3 testnet (`102031`) and official Sepolia USDC.

## 2. Sepolia payment

The buyer transferred 5 raw-decimal USDC units (`5,000,000`) to the bound seller
at Sepolia block `11,566,178`.

- Local artifact: [`payment/sepolia-tx.json`](payment/sepolia-tx.json)
- [View Sepolia payment](https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010)

## 3. Attestcoin proof

Attestcoin accepted query ID
`0x4c94e8b11295001bc24b7f61686c02aca5b817a0ce4ac1917f50163ad853e655`
for the same source block after 489 seconds.

- Local artifact: [`attestcoin/proof-run.json`](attestcoin/proof-run.json)

## 4. Creditcoin settlement

The verified proof settled sale
`0x8d4c39b6bc44f36e8c2456c3c47f6d04c907475f37e05c16fd2655b9bb3b6c1d`
on Creditcoin CC3.

- Local artifact: [`settlement/creditcoin-tx.json`](settlement/creditcoin-tx.json)
- [View Creditcoin settlement](https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96)

## 5. Ownership result

Before settlement, the seller held one TestRWA #1001 and the buyer held zero.
After settlement, the buyer held one and escrow held zero.

- Before: [`rwa/before.json`](rwa/before.json)
- After: [`rwa/after.json`](rwa/after.json)

## 6. Replay protection

The settlement artifact records the replay marker as `true`. The accepted query
ID cannot settle another sale.

## Limitations

This evidence is testnet-only. Asset onboarding is curated, Attestcoin
attestation normally takes 8–10 minutes, and the payment/release sequence is not
an atomic two-chain swap. Sepolia payment becomes irreversible before the
Creditcoin release completes.
