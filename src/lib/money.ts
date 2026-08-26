import { ApiError } from "./http";

export function parseUsdc(value: string): bigint {
  if (!/^(0|[1-9]\d*)\.\d{6}$/.test(value))
    throw new ApiError(
      400,
      "INVALID_PAYMENT_AMOUNT",
      "USDC amount must have exactly 6 decimals",
    );
  const [whole = "0", fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 1_000_000n + BigInt(fraction);
  if (amount <= 0n)
    throw new ApiError(
      400,
      "INVALID_PAYMENT_AMOUNT",
      "Payment amount must be positive",
    );
  return amount;
}
