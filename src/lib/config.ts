import { z } from "zod";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const optionalAddress = z
  .string()
  .optional()
  .transform((value) => value || undefined)
  .pipe(address.optional());

const schema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  CREDITCOIN_RPC_URL: z
    .string()
    .url()
    .default("https://rpc.cc3-testnet.creditcoin.network"),
  CREDITCOIN_RPC_FALLBACK_URL: z
    .string()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().url().optional()),
  CREDITCOIN_CHAIN_ID: z.coerce.number().int().default(102031),
  CREDITCOIN_PROOF_BUILDER_URL: z
    .string()
    .url()
    .default("https://prover.cc3-testnet.creditcoin.network/"),
  SEPOLIA_RPC_URL: z.string().optional(),
  SEPOLIA_CHAIN_ID: z.coerce.number().int().default(11155111),
  SEPOLIA_ATTESTCOIN_CHAIN_KEY: z.coerce.number().int().default(1),
  SEPOLIA_USDC_ADDRESS: address.default(
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  ),
  TEST_RWA_ADDRESS: optionalAddress,
  SETTLE_RWA_ADDRESS: optionalAddress,
  PAYMENT_VERIFIER_USC_ADDRESS: optionalAddress,
  SESSION_SECRET: z
    .string()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().min(32).optional()),
  SIWE_DOMAIN: z.string().default("localhost"),
  CREDITCOIN_WORKER_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  DEPLOYER_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  BUYER_SEPOLIA_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined)
    .pipe(
      z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/)
        .optional(),
    ),
});

export const config = schema.parse(process.env);
