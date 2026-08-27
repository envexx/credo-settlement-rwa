import assert from "node:assert/strict";
import test from "node:test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
const { withDemoSellerLock } = await import("./store");

test(
  "serializes concurrent demo seller operations",
  {
    skip: !process.env.DATABASE_URL,
  },
  async () => {
    let running = 0;
    let maximum = 0;

    await Promise.all(
      [1, 2].map(() =>
        withDemoSellerLock(async () => {
          running++;
          maximum = Math.max(maximum, running);
          await new Promise((resolve) => setTimeout(resolve, 25));
          running--;
        }),
      ),
    );

    assert.equal(maximum, 1);
  },
);
