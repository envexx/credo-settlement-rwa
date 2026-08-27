import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appRoot = new URL("./", import.meta.url);

async function source(path: string) {
  return readFile(new URL(path, appRoot), "utf8");
}

test("product-facing copy does not call Credo a primitive", async () => {
  const copy = await Promise.all([
    source("page.tsx"),
    source("infra/page.tsx"),
    source("playground/page.tsx"),
    source("../components/site-header.tsx"),
  ]);

  for (const content of copy) assert.doesNotMatch(content, /primitive/i);
});

test("playground presents a live testnet settlement flow", async () => {
  const [page, component] = await Promise.all([
    source("playground/page.tsx"),
    source("../components/playground.tsx"),
  ]);
  const content = `${page}\n${component}`;

  assert.match(content, /Live testnet settlement/);
  assert.match(content, /Connect & reserve live RWA/);
  assert.match(content, /Pay 1\.00 test USDC/);
  assert.match(content, /Attestcoin/);
  assert.doesNotMatch(content, /Guided testnet simulation/);
  assert.doesNotMatch(content, /Run without wallet/);
});

test("the mock playground route is removed", async () => {
  await assert.rejects(source("api/demo/route.ts"));
});

test("root layout declares its smooth scroll behavior to Next.js", async () => {
  const layout = await source("layout.tsx");
  assert.match(layout, /data-scroll-behavior="smooth"/);
});
