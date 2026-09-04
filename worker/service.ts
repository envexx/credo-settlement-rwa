import postgres from "postgres";
import type { IndexedSale } from "../src/lib/store";
import { isRetryable, retryDelay } from "./core";
import { processLivePayment } from "./live";
import { drainAndExit } from "./drain";
import { isAlreadyProcessedError } from "./reconcile";
import {
  recoverableIntermediateStatuses,
  staleJobMilliseconds,
} from "./recovery";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_REQUIRED");
const sql = postgres(url, { max: 4 });
type ClaimedJob = {
  id: string;
  payment_attempt_id: string;
  sale_id: string;
  source_tx_hash: string;
  attempt_count: number;
  creditcoin_tx_hash?: string | null;
};

async function claimJob() {
  const rows = await sql.begin(async (tx) => {
    const jobs =
      await tx`SELECT j.*, p.sale_id, p.source_tx_hash FROM proof_jobs j JOIN payment_attempts p ON p.id=j.payment_attempt_id WHERE (j.status IN ('RECEIVED','RETRYABLE_ERROR') AND (j.next_retry_at IS NULL OR j.next_retry_at <= now())) OR (j.status = ANY(${recoverableIntermediateStatuses}::text[]) AND j.updated_at < now() - ${staleJobMilliseconds} * interval '1 millisecond') ORDER BY j.created_at FOR UPDATE SKIP LOCKED LIMIT 1`;
    if (!jobs[0]) return [];
    await tx`UPDATE proof_jobs SET status='SOURCE_TX_PENDING', updated_at=now() WHERE id=${jobs[0].id}`;
    return jobs;
  });
  return rows[0] as ClaimedJob | undefined;
}

const settlementAbi = [
  "function getSale(bytes32) view returns(tuple(address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
];

type ReconciledSettlement = {
  creditcoinTxHash: string;
  sourceBlock: string | null;
  queryId: string | null;
};

async function reconcileSettledSale(
  job: ClaimedJob,
  sale: IndexedSale,
  settlementTxHash: string,
): Promise<ReconciledSettlement | undefined> {
  if (
    !process.env.SEPOLIA_RPC_URL ||
    !process.env.CREDITCOIN_RPC_URL ||
    !process.env.SETTLE_RWA_ADDRESS
  )
    return undefined;
  const { Contract, JsonRpcProvider } = await import("ethers");
  const { creditcoinProvider } = await import("../src/lib/rpc");
  const { acceptedQueryId } = await import("./reconcile");
  const creditcoin = creditcoinProvider(
    process.env.CREDITCOIN_RPC_URL,
    process.env.CREDITCOIN_RPC_FALLBACK_URL,
  );
  const onchainSale = await new Contract(
    process.env.SETTLE_RWA_ADDRESS,
    settlementAbi,
    creditcoin,
  ).getFunction("getSale")(sale.saleId);
  if (Number(onchainSale.status) !== 2) return undefined;
  const receipt = await new JsonRpcProvider(
    process.env.CREDITCOIN_RPC_URL,
  ).getTransactionReceipt(settlementTxHash);
  let queryId: string | null = null;
  let sourceBlock: string | null = null;
  if (receipt) {
    queryId = acceptedQueryId(receipt) ?? null;
    const source = await new JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL,
    ).getTransactionReceipt(job.source_tx_hash);
    sourceBlock = source ? String(source.blockNumber) : null;
  }
  return { creditcoinTxHash: settlementTxHash, sourceBlock, queryId };
}

async function markSettled(
  job: ClaimedJob,
  sale: IndexedSale,
  result: ReconciledSettlement,
) {
  await sql.begin(async (tx) => {
    await tx`UPDATE proof_jobs SET status='SETTLED', creditcoin_tx_hash=${result.creditcoinTxHash}, query_id=coalesce(${result.queryId}, proof_jobs.query_id), updated_at=now() WHERE id=${job.id}`;
    await tx`UPDATE payment_attempts SET status='SETTLED', source_block=coalesce(${result.sourceBlock}, payment_attempts.source_block) WHERE id=${job.payment_attempt_id}`;
    await tx`UPDATE sales_index SET status='SETTLED' WHERE sale_id=${sale.saleId}`;
    await tx`INSERT INTO audit_events(id,event_type,sale_id,payment_attempt_id,details) VALUES(gen_random_uuid(),'SALE_SETTLED_RECONCILED',${sale.saleId},${job.payment_attempt_id},${tx.json(result)})`;
  });
}

async function tick() {
  const job = await claimJob();
  if (!job) return false;
  const rows =
    await sql`SELECT * FROM sales_index WHERE sale_id=${job.sale_id}`;
  const row = rows[0];
  if (!row) throw new Error("SALE_NOT_FOUND");
  const sale: IndexedSale = {
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
  };
  const heartbeat = setInterval(() => {
    void sql`UPDATE proof_jobs SET updated_at=now() WHERE id=${job.id}`.catch(
      () => undefined,
    );
  }, 30_000);
  try {
    if (job.creditcoin_tx_hash) {
      const reconciled = await reconcileSettledSale(
        job,
        sale,
        job.creditcoin_tx_hash,
      );
      if (reconciled) {
        await markSettled(job, sale, reconciled);
        return true;
      }
    }
    const result = await processLivePayment(
      sale,
      job.source_tx_hash,
      async (settlementTxHash) => {
        await sql`UPDATE proof_jobs SET status='SUBMITTED', creditcoin_tx_hash=${settlementTxHash}, updated_at=now() WHERE id=${job.id}`;
      },
    );
    await sql.begin(async (tx) => {
      await tx`UPDATE proof_jobs SET status='SETTLED', creditcoin_tx_hash=${result.creditcoinTxHash}, query_id=${result.queryId}, updated_at=now() WHERE id=${job.id}`;
      await tx`UPDATE payment_attempts SET status='SETTLED', source_block=${result.sourceBlock} WHERE id=${job.payment_attempt_id}`;
      await tx`UPDATE sales_index SET status='SETTLED' WHERE sale_id=${sale.saleId}`;
      await tx`INSERT INTO audit_events(id,event_type,sale_id,payment_attempt_id,details) VALUES(gen_random_uuid(),'SALE_SETTLED',${sale.saleId},${job.payment_attempt_id},${tx.json(result)})`;
    });
  } catch (error) {
    if (
      isAlreadyProcessedError(error) &&
      job.creditcoin_tx_hash &&
      (await reconcileSettledSale(job, sale, job.creditcoin_tx_hash))
    ) {
      const reconciled = await reconcileSettledSale(
        job,
        sale,
        job.creditcoin_tx_hash,
      );
      if (reconciled) {
        await markSettled(job, sale, reconciled);
        return true;
      }
    }
    const attempt = Number(job.attempt_count) + 1;
    const retryable = isRetryable(error);
    const next = new Date(Date.now() + retryDelay(attempt));
    const message = error instanceof Error ? error.message : String(error);
    if (!retryable)
      await sql`UPDATE proof_jobs SET creditcoin_tx_hash=NULL, attempt_count=${attempt}, status='PERMANENT_REJECTION', next_retry_at=NULL, updated_at=now() WHERE id=${job.id}`;
    else
      await sql`UPDATE proof_jobs SET attempt_count=${attempt}, status='RETRYABLE_ERROR', next_retry_at=${next}, updated_at=now() WHERE id=${job.id}`;
    await sql`UPDATE payment_attempts SET status=${retryable ? "RETRYABLE_ERROR" : "PERMANENT_REJECTION"}, last_error_code=${message.slice(0, 64)}, last_error_message=${message.slice(0, 1000)} WHERE id=${job.payment_attempt_id}`;
  } finally {
    clearInterval(heartbeat);
  }
  return true;
}

async function main() {
  console.log(
    JSON.stringify({
      level: "info",
      service: "proof-worker",
      stage: "STARTED",
      mode: "drain-and-exit",
    }),
  );
  const processed = await drainAndExit(tick, () => sql.end());
  console.log(
    JSON.stringify({
      level: "info",
      service: "proof-worker",
      stage: "IDLE_EXIT",
      processed,
    }),
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
