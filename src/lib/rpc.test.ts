import assert from "node:assert/strict";
import test from "node:test";
import { FallbackProvider, JsonRpcProvider } from "ethers";
import { creditcoinProvider } from "./rpc.ts";

test("uses one provider when no fallback is configured", () => {
  assert.ok(
    creditcoinProvider("http://primary.invalid") instanceof JsonRpcProvider,
  );
});

test("configures priority failover when a second RPC is available", () => {
  const provider = creditcoinProvider(
    "http://primary.invalid",
    "http://fallback.invalid",
  );
  assert.ok(provider instanceof FallbackProvider);
  assert.equal(provider.providerConfigs.length, 2);
  assert.deepEqual(
    provider.providerConfigs.map(({ priority }) => priority),
    [1, 2],
  );
});
