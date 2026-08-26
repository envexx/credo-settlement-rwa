import { z } from "zod";
export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");
export const hashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");
export const uintSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/, "Expected unsigned decimal string");
export const nonceRequest = z.object({ walletAddress: addressSchema }).strict();
export const verifyRequest = z
  .object({
    walletAddress: addressSchema,
    message: z.string().min(1).max(2048),
    signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  })
  .strict();
export const prepareSaleRequest = z
  .object({
    buyer: addressSchema,
    assetContract: addressSchema,
    tokenId: uintSchema,
    assetAmount: uintSchema,
    paymentNetwork: z.literal("sepolia"),
    paymentRecipient: addressSchema,
    paymentAmount: z.string(),
  })
  .strict();
export const indexSaleRequest = z
  .object({
    saleId: hashSchema,
    creationTxHash: hashSchema,
  })
  .strict();
export const paymentRequest = z.object({ sourceTxHash: hashSchema }).strict();
