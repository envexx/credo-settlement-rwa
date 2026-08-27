import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import { config } from "./config";
import { ApiError } from "./http";

export type IndexedSale = {
  saleId: string;
  seller: string;
  buyer: string;
  assetContract: string;
  tokenId: string;
  assetAmount: string;
  paymentChainKey: number;
  paymentChainId: number;
  paymentToken: string;
  paymentRecipient: string;
  paymentAmount: string;
  sourceStartBlock: string;
  sourceEndBlock: string;
  status: "OPEN" | "SETTLED" | "RECLAIMED";
};
export type PaymentStatus =
  | "RECEIVED"
  | "SOURCE_TX_PENDING"
  | "SOURCE_TX_CONFIRMED"
  | "LOCALLY_MATCHED"
  | "WAITING_ATTESTATION"
  | "GENERATING_PROOF"
  | "PROOF_READY"
  | "SUBMITTING"
  | "SUBMITTED"
  | "ONCHAIN_VERIFIED"
  | "SETTLED"
  | "RETRYABLE_ERROR"
  | "PERMANENT_REJECTION";
export type PaymentAttempt = {
  id: string;
  saleId: string;
  sourceTxHash: string;
  status: PaymentStatus;
  sourceBlock?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};
export type ProofJob = {
  id: string;
  paymentAttemptId: string;
  chainKey: number;
  status: PaymentStatus;
  attemptCount: number;
  nextRetryAt?: string;
  queryId?: string;
  creditcoinTxHash?: string;
};

type Nonce = { hash: string; expiresAt: number; consumed: boolean };
class MemoryStore {
  nonces = new Map<string, Nonce>();
  sales = new Map<string, IndexedSale>();
  payments = new Map<string, PaymentAttempt>();
  jobs = new Map<string, ProofJob>();
  audit: Array<{ type: string; saleId?: string; at: string }> = [];
}
const globalStore = globalThis as typeof globalThis & {
  settlerwaStore?: MemoryStore;
};
export const store = (globalStore.settlerwaStore ??= new MemoryStore());

export function hashNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("hex");
}
export function saveNonce(wallet: string, nonce: string, expiresAt: number) {
  store.nonces.set(wallet.toLowerCase(), {
    hash: hashNonce(nonce),
    expiresAt,
    consumed: false,
  });
}
export function consumeNonce(wallet: string, nonce: string) {
  const item = store.nonces.get(wallet.toLowerCase());
  if (!item || item.hash !== hashNonce(nonce)) return "INVALID" as const;
  if (item.consumed) return "CONSUMED" as const;
  if (Date.now() > item.expiresAt) return "EXPIRED" as const;
  item.consumed = true;
  return "OK" as const;
}
export async function persistNonce(
  wallet: string,
  nonce: string,
  expiresAt: number,
) {
  saveNonce(wallet, nonce, expiresAt);
  if (!sql) return;
  await sql`INSERT INTO auth_nonces(wallet_address,nonce_hash,expires_at) VALUES(${wallet.toLowerCase()},${hashNonce(nonce)},${new Date(expiresAt)})`;
}
export async function consumePersistedNonce(wallet: string, nonce: string) {
  if (!sql) return consumeNonce(wallet, nonce);
  const rows =
    await sql`UPDATE auth_nonces SET consumed_at=now() WHERE wallet_address=${wallet.toLowerCase()} AND nonce_hash=${hashNonce(nonce)} AND consumed_at IS NULL AND expires_at > now() RETURNING wallet_address`;
  if (rows[0]) return "OK" as const;
  const found =
    await sql`SELECT consumed_at,expires_at FROM auth_nonces WHERE wallet_address=${wallet.toLowerCase()} AND nonce_hash=${hashNonce(nonce)}`;
  if (!found[0]) return "INVALID" as const;
  if (found[0].consumed_at) return "CONSUMED" as const;
  return "EXPIRED" as const;
}
export function addSale(sale: IndexedSale) {
  store.sales.set(sale.saleId.toLowerCase(), sale);
  store.audit.push({
    type: "SALE_INDEXED",
    saleId: sale.saleId,
    at: new Date().toISOString(),
  });
}
export function getSale(id: string) {
  return store.sales.get(id.toLowerCase());
}
export function addPayment(
  saleId: string,
  sourceTxHash: string,
): PaymentAttempt {
  for (const payment of store.payments.values())
    if (payment.sourceTxHash.toLowerCase() === sourceTxHash.toLowerCase()) {
      if (payment.saleId.toLowerCase() !== saleId.toLowerCase())
        throw new ApiError(
          409,
          "PAYMENT_TX_ALREADY_ASSIGNED",
          "Transaction hash is already assigned to another sale",
        );
      return payment;
    }
  const payment: PaymentAttempt = {
    id: randomUUID(),
    saleId,
    sourceTxHash,
    status: "RECEIVED",
  };
  store.payments.set(payment.id, payment);
  const sale = getSale(saleId);
  if (!sale) throw new Error("SALE_NOT_FOUND");
  const job: ProofJob = {
    id: randomUUID(),
    paymentAttemptId: payment.id,
    chainKey: sale.paymentChainKey,
    status: "RECEIVED",
    attemptCount: 0,
  };
  store.jobs.set(job.id, job);
  store.audit.push({
    type: "PAYMENT_REGISTERED",
    saleId,
    at: new Date().toISOString(),
  });
  return payment;
}
export function paymentForSale(saleId: string) {
  return [...store.payments.values()].find(
    (item) => item.saleId.toLowerCase() === saleId.toLowerCase(),
  );
}
export function jobForPayment(paymentId: string) {
  return [...store.jobs.values()].find(
    (item) => item.paymentAttemptId === paymentId,
  );
}
export function dueJobs(now = Date.now()) {
  return [...store.jobs.values()].filter(
    (job) => !job.nextRetryAt || Date.parse(job.nextRetryAt) <= now,
  );
}

const sql = config.DATABASE_URL
  ? postgres(config.DATABASE_URL, { max: 2, idle_timeout: 20 })
  : undefined;

export async function withDemoSellerLock<T>(operation: () => Promise<T>) {
  if (!sql) return operation();
  const connection = await sql.reserve();
  try {
    await connection`SELECT pg_advisory_lock(hashtext('credo-demo-seller'))`;
    return await operation();
  } finally {
    await connection`SELECT pg_advisory_unlock(hashtext('credo-demo-seller'))`;
    await connection.release();
  }
}

export async function findOpenDemoSaleForBuyer(
  demoSeller: string,
  buyer: string,
) {
  if (!sql) return undefined;
  const rows =
    await sql`SELECT sale_id FROM sales_index WHERE seller=${demoSeller.toLowerCase()} AND buyer=${buyer.toLowerCase()} AND status='OPEN' LIMIT 1`;
  return rows[0]?.sale_id as string | undefined;
}

export async function countOpenDemoSales(demoSeller: string) {
  if (!sql) return 0;
  const rows =
    await sql`SELECT count(*)::int AS count FROM sales_index WHERE seller=${demoSeller.toLowerCase()} AND status='OPEN'`;
  return Number(rows[0]?.count ?? 0);
}

export async function findOpenDemoSales(demoSeller: string) {
  if (!sql) return [] as string[];
  const rows =
    await sql`SELECT sale_id FROM sales_index WHERE seller=${demoSeller.toLowerCase()} AND status='OPEN' ORDER BY created_at`;
  return rows.map((row) => row.sale_id as string);
}

export async function markSaleReclaimed(saleId: string) {
  if (!sql) return;
  await sql`UPDATE sales_index SET status='RECLAIMED' WHERE sale_id=${saleId} AND status='OPEN'`;
}

export async function persistSale(sale: IndexedSale) {
  addSale(sale);
  if (!sql) return;
  await sql`INSERT INTO sales_index(sale_id,seller,buyer,asset_contract,token_id,asset_amount,payment_chain_key,payment_chain_id,payment_token,payment_recipient,payment_amount,source_start_block,source_end_block,status) VALUES(${sale.saleId},${sale.seller},${sale.buyer},${sale.assetContract},${sale.tokenId},${sale.assetAmount},${sale.paymentChainKey},${sale.paymentChainId},${sale.paymentToken},${sale.paymentRecipient},${sale.paymentAmount},${sale.sourceStartBlock},${sale.sourceEndBlock},${sale.status}) ON CONFLICT(sale_id) DO NOTHING`;
}
export async function findSale(id: string): Promise<IndexedSale | undefined> {
  if (!sql) return getSale(id);
  const rows = await sql`SELECT * FROM sales_index WHERE sale_id=${id}`;
  const row = rows[0];
  return row
    ? {
        saleId: row.sale_id,
        seller: row.seller,
        buyer: row.buyer,
        assetContract: row.asset_contract,
        tokenId: row.token_id,
        assetAmount: row.asset_amount,
        paymentChainKey: Number(row.payment_chain_key),
        paymentChainId: Number(row.payment_chain_id),
        paymentToken: row.payment_token,
        paymentRecipient: row.payment_recipient,
        paymentAmount: row.payment_amount,
        sourceStartBlock: row.source_start_block,
        sourceEndBlock: row.source_end_block,
        status: row.status,
      }
    : undefined;
}
export async function persistPayment(
  saleId: string,
  sourceTxHash: string,
): Promise<PaymentAttempt> {
  if (!sql) return addPayment(saleId, sourceTxHash);
  const paymentId = randomUUID();
  const jobId = randomUUID();
  const sale = await findSale(saleId);
  if (!sale) throw new Error("SALE_NOT_FOUND");
  const rows = await sql.begin(async (tx) => {
    const existing =
      await tx`SELECT id,sale_id,source_tx_hash,status,source_block,last_error_code,last_error_message FROM payment_attempts WHERE source_tx_hash=${sourceTxHash}`;
    if (existing[0]) {
      if (existing[0].sale_id.toLowerCase() !== saleId.toLowerCase())
        throw new ApiError(
          409,
          "PAYMENT_TX_ALREADY_ASSIGNED",
          "Transaction hash is already assigned to another sale",
        );
      return existing;
    }
    const inserted =
      await tx`INSERT INTO payment_attempts(id,sale_id,source_tx_hash,status) VALUES(${paymentId},${saleId},${sourceTxHash},'RECEIVED') RETURNING id,sale_id,source_tx_hash,status`;
    await tx`INSERT INTO proof_jobs(id,payment_attempt_id,chain_key,status) VALUES(${jobId},${paymentId},${sale.paymentChainKey},'RECEIVED')`;
    await tx`INSERT INTO audit_events(id,event_type,sale_id,payment_attempt_id) VALUES(${randomUUID()},'PAYMENT_REGISTERED',${saleId},${paymentId})`;
    return inserted;
  });
  const row = rows[0]!;
  return {
    id: row.id,
    saleId: row.sale_id,
    sourceTxHash: row.source_tx_hash,
    status: row.status,
  };
}
export async function settlementForSale(saleId: string) {
  if (!sql) {
    const sale = getSale(saleId);
    const payment = paymentForSale(saleId);
    return {
      sale,
      payment,
      job: payment ? jobForPayment(payment.id) : undefined,
    };
  }
  const sale = await findSale(saleId);
  if (!sale) return { sale: undefined, payment: undefined, job: undefined };
  const payments =
    await sql`SELECT * FROM payment_attempts WHERE sale_id=${saleId} ORDER BY detected_at DESC LIMIT 1`;
  const p = payments[0];
  if (!p) return { sale, payment: undefined, job: undefined };
  const jobs =
    await sql`SELECT * FROM proof_jobs WHERE payment_attempt_id=${p.id}`;
  const j = jobs[0];
  const payment: PaymentAttempt = {
    id: p.id,
    saleId: p.sale_id,
    sourceTxHash: p.source_tx_hash,
    status: p.status,
    ...(p.source_block ? { sourceBlock: p.source_block } : {}),
  };
  const job: ProofJob | undefined = j
    ? {
        id: j.id,
        paymentAttemptId: j.payment_attempt_id,
        chainKey: Number(j.chain_key),
        status: j.status,
        attemptCount: j.attempt_count,
        ...(j.query_id ? { queryId: j.query_id } : {}),
        ...(j.creditcoin_tx_hash
          ? { creditcoinTxHash: j.creditcoin_tx_hash }
          : {}),
      }
    : undefined;
  return { sale, payment, job };
}
