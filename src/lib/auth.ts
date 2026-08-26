import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import { config } from "./config";
import { ApiError } from "./http";
import { consumePersistedNonce, persistNonce } from "./store";

const COOKIE = "settlerwa_session";
const secret = () =>
  config.SESSION_SECRET ??
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("SESSION_SECRET_REQUIRED");
      })()
    : "development-only-secret-change-me");
const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

export async function issueChallenge(wallet: string) {
  const nonce = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + 5 * 60_000;
  await persistNonce(wallet, nonce, expiresAt);
  const message = `${config.SIWE_DOMAIN} wants you to sign in with your Ethereum account:\n${wallet}\n\nSign in to SettleRWA\n\nNonce: ${nonce}\nExpiration Time: ${new Date(expiresAt).toISOString()}`;
  return { nonce, expiresAt: new Date(expiresAt).toISOString(), message };
}

export async function authenticate(
  wallet: `0x${string}`,
  message: string,
  signature: `0x${string}`,
) {
  const nonce = /Nonce: ([A-Za-z0-9_-]+)/.exec(message)?.[1];
  if (
    !nonce ||
    !message.includes(`\n${wallet}\n`) ||
    !message.startsWith(`${config.SIWE_DOMAIN} wants`)
  )
    throw new ApiError(401, "INVALID_SIGNATURE", "Invalid sign-in message");
  if (!(await verifyMessage({ address: wallet, message, signature })))
    throw new ApiError(401, "INVALID_SIGNATURE", "Signature is invalid");
  const state = await consumePersistedNonce(wallet, nonce);
  if (state === "CONSUMED")
    throw new ApiError(409, "NONCE_CONSUMED", "Nonce was already consumed");
  if (state === "EXPIRED")
    throw new ApiError(410, "NONCE_EXPIRED", "Nonce has expired");
  if (state !== "OK")
    throw new ApiError(401, "INVALID_SIGNATURE", "Signature is invalid");
  const expires = Date.now() + 15 * 60_000;
  const payload = Buffer.from(
    JSON.stringify({ wallet: wallet.toLowerCase(), expires }),
  ).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
}

export async function requireWallet() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value)
    throw new ApiError(401, "NOT_AUTHENTICATED", "Authentication required");
  const [payload, signature] = value.split(".");
  if (!payload || !signature)
    throw new ApiError(401, "INVALID_SESSION", "Invalid session");
  const actual = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (actual.length !== supplied.length || !timingSafeEqual(actual, supplied))
    throw new ApiError(401, "INVALID_SESSION", "Invalid session");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    wallet: string;
    expires: number;
  };
  if (Date.now() > data.expires)
    throw new ApiError(401, "SESSION_EXPIRED", "Session expired");
  return data.wallet;
}
