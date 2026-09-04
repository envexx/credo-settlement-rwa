import { Interface, type TransactionReceipt } from "ethers";

const paymentProofAccepted = new Interface([
  "event PaymentProofAccepted(bytes32 indexed saleId,bytes32 indexed queryId,uint64 chainKey,uint64 sourceBlock)",
]);

export function isAlreadyProcessedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("QueryAlreadyProcessed");
}

export function acceptedQueryId(
  receipt: TransactionReceipt | null | undefined,
): string | undefined {
  if (!receipt) return undefined;
  for (const log of receipt.logs) {
    try {
      const parsed = paymentProofAccepted.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parsed?.name === "PaymentProofAccepted")
        return String(parsed.args.queryId);
    } catch {
      /* unrelated log */
    }
  }
  return undefined;
}
