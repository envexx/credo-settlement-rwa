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

test("playground passes a parsed ERC-20 ABI to viem", async () => {
  const component = await source("../components/playground.tsx");

  assert.match(component, /parseAbi/);
  assert.match(component, /const erc20Abi = parseAbi\(/);
});

test("an open live sale can reconnect its buyer wallet after refresh", async () => {
  const component = await source("../components/playground.tsx");

  assert.match(component, /Connect wallet to pay/);
  assert.match(component, /authenticateWallet/);
});

test("the mock playground route is removed", async () => {
  await assert.rejects(source("api/demo/route.ts"));
});

test("root layout declares its smooth scroll behavior to Next.js", async () => {
  const layout = await source("layout.tsx");
  assert.match(layout, /data-scroll-behavior="smooth"/);
});

test("every product route offers a keyboard skip target", async () => {
  const [header, ...pages] = await Promise.all([
    source("../components/site-header.tsx"),
    source("page.tsx"),
    source("infra/page.tsx"),
    source("playground/page.tsx"),
    source("tx/[saleId]/page.tsx"),
  ]);

  assert.match(header, /href="#main-content"/);
  assert.match(header, /Skip to main content/);
  for (const page of pages) {
    assert.match(page, /<main[^>]*id="main-content"/);
    assert.match(page, /<main[^>]*tabIndex=\{-1\}/);
  }
});
