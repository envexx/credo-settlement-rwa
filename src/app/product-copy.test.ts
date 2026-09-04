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

test("playground preflights the reserved payment on Sepolia", async () => {
  const component = await source("../components/playground.tsx");

  assert.match(component, /function switchToSepolia/);
  assert.match(
    component,
    /const \[payment, setPayment\] = useState<PaymentInstruction>\(\)/,
  );
  assert.match(component, /balance < BigInt\(payment\.amountRaw\)/);
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

test("playground exposes recoverable accessible progress", async () => {
  const playground = await source("../components/playground.tsx");
  assert.match(playground, /SettlementStatus/);
  assert.match(playground, /\/tx\/\$\{saleId\}/);
  assert.match(playground, /Before you pay/);
  assert.match(playground, /Sepolia test USDC/);
  assert.match(playground, /Creditcoin CC3/);
  assert.doesNotMatch(playground, /function statusCopy/);
});

test("recovery route reads live settlement state", async () => {
  const [page, component] = await Promise.all([
    source("tx/[saleId]/page.tsx"),
    source("../components/recovery-status.tsx"),
  ]);
  assert.match(page, /RecoveryStatus/);
  assert.match(component, /api\/v1\/sales\/\$\{saleId\}\/settlement/);
  assert.match(
    component,
    /settlement \? <SettlementStatus copy=\{copy\} \/> : null/,
  );
  assert.doesNotMatch(page, /489 SEC/);
});

test("site header exposes primary navigation on mobile", async () => {
  const [header, mobile, data] = await Promise.all([
    source("../components/site-header.tsx"),
    source("../components/mobile-nav.tsx"),
    source("../components/site-navigation.ts"),
  ]);
  assert.match(header, /MobileNav/);
  assert.match(mobile, /aria-label="Open primary navigation"/);
  assert.match(mobile, /min-h-11/);
  assert.match(data, /Interactive playground/);
});
