import { Interface, TransactionReceipt } from "ethers";
import type { IndexedSale, PaymentStatus } from "../src/lib/store";

const usdc = new Interface([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);
const transientPatterns = [
  /timeout/i,
  /429/,
  /not ready/i,
  /not attested/i,
  /temporarily/i,
  /network/i,
  /source_tx_pending/i,
  /missing revert data/i,
  /server error/i,
];
export const retryDelaysMs = [
  15_000, 30_000, 60_000, 120_000, 300_000,
] as const;

export class PermanentPaymentError extends Error {}
export function retryDelay(attempt: number) {
  return retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)]!;
}
export function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return transientPatterns.some((pattern) => pattern.test(message));
}

export function validateReceipt(
  receipt: TransactionReceipt,
  sale: IndexedSale,
) {
  if (receipt.status !== 1)
    throw new PermanentPaymentError("SOURCE_TRANSACTION_FAILED");
  if (
    receipt.blockNumber < BigInt(sale.sourceStartBlock) ||
    receipt.blockNumber > BigInt(sale.sourceEndBlock)
  )
    throw new PermanentPaymentError("PAYMENT_OUTSIDE_WINDOW");
  let matches = 0;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== sale.paymentToken.toLowerCase()) continue;
    try {
      const parsed = usdc.parseLog({ topics: [...log.topics], data: log.data });
      if (
        parsed?.name === "Transfer" &&
        String(parsed.args.from).toLowerCase() === sale.buyer.toLowerCase() &&
        String(parsed.args.to).toLowerCase() ===
          sale.paymentRecipient.toLowerCase() &&
        BigInt(parsed.args.value) === BigInt(sale.paymentAmount)
      )
        matches++;
    } catch {
      /* unrelated log from the same token */
    }
  }
  if (matches === 0)
    throw new PermanentPaymentError("PAYMENT_TRANSFER_NOT_FOUND");
  if (matches !== 1)
    throw new PermanentPaymentError("AMBIGUOUS_PAYMENT_TRANSFER");
}

export type WorkerJob = { status: PaymentStatus; attemptCount: number };
export async function runStage(
  job: WorkerJob,
  task: () => Promise<PaymentStatus>,
) {
  try {
    job.status = await task();
  } catch (error) {
    job.attemptCount++;
    job.status =
      error instanceof PermanentPaymentError || !isRetryable(error)
        ? "PERMANENT_REJECTION"
        : "RETRYABLE_ERROR";
  }
  return job;
}
