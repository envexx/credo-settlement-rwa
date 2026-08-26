import { FallbackProvider, JsonRpcProvider } from "ethers";

export function creditcoinProvider(primary: string, fallback?: string) {
  const urls = [primary, fallback].filter(
    (url, index, all): url is string =>
      Boolean(url) && all.indexOf(url) === index,
  );
  if (urls.length === 1) return new JsonRpcProvider(urls[0]);
  return new FallbackProvider(
    urls.map((url, index) => ({
      provider: new JsonRpcProvider(url),
      priority: index + 1,
      weight: 1,
      stallTimeout: 1_500,
    })),
    undefined,
    { quorum: 1 },
  );
}
