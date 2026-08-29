# Integrate Credo

Credo releases an escrowed ERC-1155 on Creditcoin CC3 only after its contract
verifies an exact official-USDC payment on Sepolia through Attestcoin evidence.
The worker discovers and transports evidence; it cannot authorize settlement.

## Integration sequence

0. Read [`cc3-testnet.json`](../../contracts/deployments/cc3-testnet.json) for
   canonical addresses and limits.
1. Complete curated onboarding for the seller's ERC-1155 contract.
2. From the seller wallet, approve `SettleRWA` to transfer the ERC-1155.
3. Authenticate and call `POST /api/v1/sales/prepare`, or directly call
   `createSale` using [`PARAM-SPEC.md`](PARAM-SPEC.md).
4. After `SaleCreated` succeeds, call `POST /api/v1/sales/index` with the sale
   ID and creation transaction hash when using the API.
5. Authenticate the bound buyer and display the server-provided exact payment
   instruction. The buyer transfers official Sepolia test USDC.
6. Register the transaction once with
   `POST /api/v1/sales/:saleId/payment`.
7. Poll `GET /api/v1/sales/:saleId/settlement`, or index contract events.
8. Preserve `/tx/:saleId` while Attestcoin builds the proof. Typical
   attestation takes 8–10 minutes and does not require the browser to stay open.

The API-assisted path validates requests and mirrors verified chain state. The
direct-contract path remains available to integrators that operate their own
indexer.

## Minimal viem call

```ts
import { parseAbi } from "viem";
import deployment from "../../contracts/deployments/cc3-testnet.json";

const settleRwaAbi = parseAbi([
  "function createSale(address,address,uint256,uint256,uint64,uint64,address,address,uint256,uint64,uint64) returns(bytes32)",
]);

const hash = await walletClient.writeContract({
  address: deployment.contracts.SettleRWA,
  abi: settleRwaAbi,
  functionName: "createSale",
  args: [
    buyer,
    assetContract,
    1001n,
    1n,
    1n,
    11155111n,
    deployment.source.usdc,
    seller,
    1_000_000n,
    sourceStartBlock,
    sourceStartBlock + 7_200n,
  ],
});
```

Use the compiler-generated files in [`abis/`](abis/) for production code.

## Operational boundaries

- Sepolia payment is irreversible before Creditcoin release completes; this is
  not an atomic two-chain swap.
- New assets are operator-approved in the current testnet deployment.
- Closing the browser does not stop the durable proof job.
- A retryable proof error does not require a second payment.
- A permanent rejection means the payment cannot satisfy the bound sale terms.
- Current deployment source is not yet marked verified on Blockscout; addresses
  and deployment transactions remain publicly inspectable.
