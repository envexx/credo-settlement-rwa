import assert from "node:assert/strict";
import test from "node:test";
import { drainAndExit } from "./drain";

test("exits and closes resources immediately when no job is due", async () => {
  let closed = false;
  const processed = await drainAndExit(
    async () => false,
    async () => {
      closed = true;
    },
  );
  assert.equal(processed, 0);
  assert.equal(closed, true);
});

test("drains every due job before closing resources", async () => {
  const jobs = [true, true, false];
  let closed = false;
  const processed = await drainAndExit(
    async () => jobs.shift() ?? false,
    async () => {
      closed = true;
    },
  );
  assert.equal(processed, 2);
  assert.equal(closed, true);
});

test("closes resources when processing fails", async () => {
  let closed = false;
  await assert.rejects(
    drainAndExit(
      async () => {
        throw new Error("DATABASE_UNAVAILABLE");
      },
      async () => {
        closed = true;
      },
    ),
    /DATABASE_UNAVAILABLE/,
  );
  assert.equal(closed, true);
});
