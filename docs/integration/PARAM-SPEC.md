# `createSale` parameter specification

Current CC3 signature:

```solidity
function createSale(address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock) returns (bytes32 saleId)
```

Do not use JavaScript `number` for `uint256` values; use decimal strings or
`bigint`. `chainKey is not chainId`: Sepolia uses Attestcoin chain key `1` and
EVM chain ID `11155111`.

| Argument | JSON representation | Rule | Rejection |
|---|---|---|---|
| `buyer` | address string | Non-zero private buyer wallet | `InvalidBuyer` |
| `assetContract` | address string | Operator-approved ERC-1155 | `InvalidAsset` |
| `tokenId` | decimal string | Token owned and approved by seller | ERC-1155 revert |
| `assetAmount` | decimal string | Greater than zero | `InvalidAsset` |
| `paymentChainKey` | decimal string | `1` for Sepolia in Attestcoin | `UnsupportedPaymentChain` |
| `paymentChainId` | decimal string | `11155111`, paired with chain key `1` | `UnsupportedPaymentChain` |
| `paymentToken` | address string | Official Sepolia USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | `UnsupportedPaymentToken` |
| `paymentRecipient` | address string | Non-zero seller payment recipient | `InvalidPaymentAmount` |
| `paymentAmount` | raw decimal string | Greater than zero; USDC has six decimals | `InvalidPaymentAmount` |
| `sourceStartBlock` | decimal string | Non-zero Sepolia start block | `InvalidPaymentWindow` |
| `sourceEndBlock` | decimal string | Greater than start and no more than 50,000 blocks later | `InvalidPaymentWindow` |

## Cross-field rules

- The tuple `(paymentChainKey, paymentToken, buyer, paymentRecipient,
  paymentAmount)` can back only one open sale. Reuse causes
  `DuplicatePaymentTuple`.
- Only the bound buyer's successful transfer can satisfy the sale.
- Asset and payment-token allowlists are curated operator configuration.
- Reclaim becomes available after the payment window plus at least 24 hours.
- Payment is irreversible before cross-chain release completes. Credo is not an
  atomic two-chain swap.

## Valid JSON example

```json
{
  "buyer": "0x1111111111111111111111111111111111111111",
  "assetContract": "0xEe1e1D277d011157dAC95F59189E9d5877668284",
  "tokenId": "1001",
  "assetAmount": "1",
  "paymentChainKey": "1",
  "paymentChainId": "11155111",
  "paymentToken": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "paymentRecipient": "0x2222222222222222222222222222222222222222",
  "paymentAmount": "1000000",
  "sourceStartBlock": "12000000",
  "sourceEndBlock": "12007200"
}
```

## Error ownership

| Error | Meaning | Corrective owner |
|---|---|---|
| `InvalidBuyer` | Buyer is zero | Integrator/user |
| `InvalidAsset` | Asset is not approved or amount is zero | Integrator/operator |
| `InvalidPaymentAmount` | Recipient is zero or amount is zero | Integrator |
| `InvalidPaymentWindow` | Block window is malformed or too large | Integrator |
| `UnsupportedPaymentChain` | Chain key and chain ID are unsupported | Operator/integrator |
| `UnsupportedPaymentToken` | Token is not approved for that chain key | Operator |
| `DuplicatePaymentTuple` | Identical payment terms already have an open sale | Integrator/user |
| `CreationPaused` | Operator paused new sales | Operator |
