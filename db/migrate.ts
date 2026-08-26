import { readFile } from "node:fs/promises";
import postgres from "postgres";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_REQUIRED");
const sql = postgres(url, { max: 1 });
await sql.unsafe(
  await readFile(
    new URL("./migrations/0001_initial.sql", import.meta.url),
    "utf8",
  ),
);
await sql.end();
console.log("Database migration complete");
