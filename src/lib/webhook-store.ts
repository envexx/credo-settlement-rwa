import postgres from "postgres";

const url = process.env.DATABASE_URL;
const sql = url ? postgres(url, { max: 5 }) : undefined;

export async function enqueueWebhook(
  saleId: string,
  endpointUrl: string,
  secret: string,
): Promise<{ id: string } | { error: "DB_UNAVAILABLE" }> {
  if (!sql) return { error: "DB_UNAVAILABLE" };
  const id = crypto.randomUUID();
  await sql`INSERT INTO webhook_endpoints(id,sale_id,url,secret) VALUES(${id},${saleId},${endpointUrl},${secret})`;
  return { id };
}

export async function webhooksForSale(saleId: string) {
  if (!sql) return [];
  return sql`SELECT id, url, status, created_at FROM webhook_endpoints WHERE sale_id=${saleId} ORDER BY created_at`;
}
