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

test("playground presents a complete guided settlement simulation", async () => {
  const [page, component] = await Promise.all([
    source("playground/page.tsx"),
    source("../components/playground.tsx"),
  ]);
  const content = `${page}\n${component}`;

  assert.match(content, /Guided testnet simulation/);
  assert.match(content, /Run without wallet/);
  assert.match(content, /Event stream/);
  assert.match(content, /Receipt checks/);
  assert.match(content, /What the developer sends/);
  assert.match(content, /What the protocol verifies/);
  assert.match(content, /View real settlement/);
});

test("playground simulation state is isolated per browser session", async () => {
  const route = await source("api/demo/route.ts");

  assert.match(route, /credo_demo_session/);
  assert.match(route, /Map<string, DemoSession>/);
});

test("root layout declares its smooth scroll behavior to Next.js", async () => {
  const layout = await source("layout.tsx");
  assert.match(layout, /data-scroll-behavior="smooth"/);
});
