import { config } from "./config";
import { ApiError } from "./http";

const state = globalThis as typeof globalThis & {
  settleRwaRates?: Map<string, { count: number; reset: number }>;
};
state.settleRwaRates ??= new Map();

export function protectRequest(request: Request, limit = 30) {
  if (Number(request.headers.get("content-length") ?? 0) > 16_384)
    throw new ApiError(413, "BODY_TOO_LARGE", "Request body exceeds 16 KiB");
  const origin = request.headers.get("origin");
  if (origin && origin !== config.APP_URL && origin !== "http://localhost:3000")
    throw new ApiError(
      403,
      "ORIGIN_NOT_ALLOWED",
      "Request origin is not allowed",
    );
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = state.settleRwaRates!.get(key);
  if (!current || current.reset <= now)
    state.settleRwaRates!.set(key, { count: 1, reset: now + 60_000 });
  else if (++current.count > limit)
    throw new ApiError(429, "RATE_LIMITED", "Too many requests");
}
