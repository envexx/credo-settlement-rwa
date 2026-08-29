# ABI stability

These files mirror compiler-generated ABIs used by the current CC3 testnet
deployment. They are not a mainnet or permanent semantic-versioning promise.

## Integrator surface

- `createSale`, `getSale`, `reclaim`, and `paymentTuple`
- `sellerNonces` and `activeSaleForPaymentTuple`
- `SaleCreated`, `AssetEscrowed`, `SaleSettled`, and `AssetReclaimed`
- `PaymentProofAccepted`

## Administrative surface

Asset, payment-source, and verifier configuration, role management, and pause
controls are operator functions. They are not part of the application
integration contract.

A future incompatible deployment receives a new manifest version. Existing ABI
files remain associated with the deployment documented here.
