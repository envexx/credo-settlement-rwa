"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Landmark,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  decodeFunctionResult,
  encodeFunctionData,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SettlementStatus } from "@/components/settlement-status";
import { settlementPresentation } from "@/lib/settlement-presentation";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

type LiveSale = {
  saleId: string;
  creationTxHash: string;
  payment: {
    chainId: number;
    token: string;
    recipient: string;
    amountRaw: string;
  };
};

type Settlement = {
  saleId: string;
  saleStatus: "OPEN" | "SETTLED" | "RECLAIMED";
  payment: {
    status: string;
    sourceTxHash: string;
    sourceBlock?: string;
  } | null;
  proof: { status: string; queryId?: string } | null;
  settlement: {
    creditcoinTxHash: string;
    assetRecipient: string;
    tokenId: string;
  } | null;
};

type PaymentInstruction = {
  chainId: number;
  token: string;
  recipient: string;
  amountRaw: string;
};

type DeepLinkState =
  "idle" | "loading" | "not-found" | "inaccessible" | "unavailable" | "loaded";

class ApiResponseError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function transfer(address,uint256) returns(bool)",
]);
const sepoliaChainId = "0xaa36a7";

const short = (value?: string) =>
  !value
    ? "—"
    : value.length > 18
      ? `${value.slice(0, 9)}…${value.slice(-7)}`
      : value;

function provider() {
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

function apiMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "error" in data) {
    const error = (data as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

async function responseJson<T>(response: Response, fallback: string) {
  const data = (await response.json()) as T;
  if (!response.ok)
    throw new ApiResponseError(response.status, apiMessage(data, fallback));
  return data;
}

async function getSettlement(id: string) {
  const response = await fetch(`/api/v1/sales/${id}/settlement`, {
    cache: "no-store",
  });
  return responseJson<Settlement>(response, "Live settlement is unavailable");
}

async function getPaymentInstruction(id: string) {
  const response = await fetch(`/api/v1/sales/${id}/payment-instruction`, {
    cache: "no-store",
  });
  return responseJson<PaymentInstruction>(
    response,
    "Payment instruction is unavailable",
  );
}

async function readUsdcBalance(
  ethereum: EthereumProvider,
  instruction: PaymentInstruction,
  wallet: string,
) {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet as Address],
  });
  const result = (await ethereum.request({
    method: "eth_call",
    params: [{ to: instruction.token, data }, "latest"],
  })) as Hex;
  const amount = decodeFunctionResult({
    abi: erc20Abi,
    functionName: "balanceOf",
    data: result,
  }) as bigint;
  return { instruction, amount };
}

async function switchToSepolia(ethereum: EthereumProvider) {
  const current = await ethereum.request({ method: "eth_chainId" });
  if (current !== sepoliaChainId)
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: sepoliaChainId }],
    });
  const active = await ethereum.request({ method: "eth_chainId" });
  if (active !== sepoliaChainId)
    throw new Error("Switch to Sepolia before paying with test USDC.");
}

export function Playground() {
  const [account, setAccount] = useState("");
  const [sale, setSale] = useState<LiveSale>();
  const [settlement, setSettlement] = useState<Settlement>();
  const [payment, setPayment] = useState<PaymentInstruction>();
  const [balance, setBalance] = useState<bigint>();
  const [pending, setPending] = useState<"reserve" | "pay">();
  const [error, setError] = useState("");
  const [authIntent, setAuthIntent] = useState<"reserve" | "pay">();
  const [deepLinkState, setDeepLinkState] = useState<DeepLinkState>("idle");

  const saleId = sale?.saleId ?? settlement?.saleId;
  const copy = settlementPresentation({
    saleStatus: settlement?.saleStatus,
    proofStatus: settlement?.proof?.status,
  });

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const id = new URLSearchParams(window.location.search).get("sale");
      if (!id) return;
      if (!/^0x[a-fA-F0-9]{64}$/.test(id)) {
        setDeepLinkState("not-found");
        return;
      }
      setDeepLinkState("loading");
      try {
        const data = await getSettlement(id);
        if (!cancelled) {
          setSettlement(data);
          setDeepLinkState("loaded");
        }
      } catch (reason) {
        if (cancelled) return;
        if (reason instanceof ApiResponseError && reason.status === 404)
          setDeepLinkState("not-found");
        else if (
          reason instanceof ApiResponseError &&
          (reason.status === 401 || reason.status === 403)
        )
          setDeepLinkState("inaccessible");
        else setDeepLinkState("unavailable");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      deepLinkState !== "loaded" ||
      !saleId ||
      settlement?.settlement ||
      settlement?.saleStatus === "RECLAIMED"
    )
      return;
    const interval = window.setInterval(() => {
      void getSettlement(saleId)
        .then(setSettlement)
        .catch(() => undefined);
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [deepLinkState, saleId, settlement?.saleStatus, settlement?.settlement]);

  async function authenticateWallet() {
    const ethereum = provider();
    if (!ethereum)
      throw new Error(
        "Install an EVM wallet to continue with live settlement.",
      );
    const accounts = (await ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    const walletAddress = accounts[0]?.toLowerCase();
    if (!walletAddress) throw new Error("Wallet did not return an account.");
    const challenge = await responseJson<{ message: string }>(
      await fetch("/api/v1/auth/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      }),
      "Sign-in challenge is unavailable",
    );
    const signature = await ethereum.request({
      method: "personal_sign",
      params: [challenge.message, walletAddress],
    });
    await responseJson(
      await fetch("/api/v1/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          message: challenge.message,
          signature,
        }),
      }),
      "Wallet signature was not accepted",
    );
    return { ethereum, walletAddress };
  }

  async function preflightPayment(
    ethereum: EthereumProvider,
    id: string,
    wallet: string,
  ) {
    await switchToSepolia(ethereum);
    const instruction = await getPaymentInstruction(id);
    const { amount } = await readUsdcBalance(ethereum, instruction, wallet);
    setAccount(wallet);
    setPayment(instruction);
    setBalance(amount);
    return { instruction, amount };
  }

  async function reserve() {
    setPending("reserve");
    setError("");
    try {
      const { ethereum, walletAddress } = await authenticateWallet();
      const created = await responseJson<LiveSale>(
        await fetch("/api/v1/playground/live-sale", { method: "POST" }),
        "Could not reserve a live test RWA",
      );
      setSale(created);
      setDeepLinkState("loaded");
      window.history.replaceState({}, "", `/playground?sale=${created.saleId}`);
      setSettlement(await getSettlement(created.saleId));
      await preflightPayment(ethereum, created.saleId, walletAddress);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Live reservation failed",
      );
    } finally {
      setPending(undefined);
    }
  }

  async function connectToPay() {
    setPending("pay");
    setError("");
    try {
      if (!saleId) return;
      const { ethereum, walletAddress } = await authenticateWallet();
      await preflightPayment(ethereum, saleId, walletAddress);
    } catch (reason) {
      setAccount("");
      setPayment(undefined);
      setBalance(undefined);
      setError(
        reason instanceof Error ? reason.message : "Wallet connection failed",
      );
    } finally {
      setPending(undefined);
    }
  }

  async function continueAuthentication() {
    const intent = authIntent;
    setAuthIntent(undefined);
    if (intent === "reserve") await reserve();
    if (intent === "pay") await connectToPay();
  }

  async function pay() {
    if (!saleId || !account) return;
    setPending("pay");
    setError("");
    try {
      const ethereum = provider();
      if (!ethereum)
        throw new Error("Install an EVM wallet to pay with test USDC.");
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];
      if (accounts[0]?.toLowerCase() !== account)
        throw new Error("Reconnect the reserved buyer wallet before paying.");
      const { instruction, amount } = await preflightPayment(
        ethereum,
        saleId,
        account,
      );
      const required = BigInt(instruction.amountRaw);
      if (amount < required)
        throw new Error(
          "Your wallet needs at least 1.00 Sepolia test USDC. Get test USDC, then try again.",
        );
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [instruction.recipient as Address, required],
      });
      const sourceTxHash = (await ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: instruction.token, data }],
      })) as string;
      await responseJson(
        await fetch(`/api/v1/sales/${saleId}/payment`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sourceTxHash }),
        }),
        "Payment could not be registered",
      );
      setSettlement(await getSettlement(saleId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Payment failed");
    } finally {
      setPending(undefined);
    }
  }

  const insufficient =
    payment !== undefined &&
    balance !== undefined &&
    balance < BigInt(payment.amountRaw);
  const canPay = Boolean(
    account &&
    saleId &&
    payment &&
    settlement?.saleStatus === "OPEN" &&
    !settlement.payment,
  );
  const settlementBlocked =
    deepLinkState === "loading" ||
    deepLinkState === "not-found" ||
    deepLinkState === "inaccessible" ||
    deepLinkState === "unavailable";

  return (
    <Card className="overflow-hidden border bg-card shadow-[0_30px_100px_rgba(0,0,0,.08)]">
      <header className="border-b bg-foreground px-5 py-4 text-background sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[.15em]">
            <span className="size-2 rounded-full bg-primary" /> LIVE TESTNET
            SETTLEMENT
          </span>
          {account ? (
            <Badge className="border-background/15 bg-background/10 text-background">
              <Wallet /> {short(account)}
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[.9fr_1.1fr] lg:p-8">
        <section>
          <p className="technical-label">LIVE OFFER</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
            One payment. One native RWA.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Reserve TestRWA #1001 for your wallet, pay 1.00 Sepolia test USDC,
            then let Attestcoin prove the receipt. You need no tCTC.
          </p>
          <div className="mt-7 grid grid-cols-3 divide-x rounded-lg border bg-secondary/25 p-4 text-center">
            <Metric label="ASSET" value="1 RWA" />
            <Metric label="PAYMENT" value="1.00 USDC" />
            <Metric label="PROOF" value="8–10 min" />
          </div>
          <div className="mt-7 space-y-3">
            <Fact label="Buyer" value={short(account)} />
            <Fact label="Sale ID" value={short(saleId)} />
            <Fact
              label="Payment tx"
              value={short(settlement?.payment?.sourceTxHash)}
            />
          </div>
        </section>

        <section className="rounded-xl border bg-secondary/20 p-5 sm:p-6">
          <p className="technical-label">CURRENT STATUS</p>
          <div className="mt-3">
            {deepLinkState === "loading" ? (
              <p className="text-sm text-muted-foreground">
                Loading settlement…
              </p>
            ) : deepLinkState === "not-found" ? (
              <p className="text-sm text-muted-foreground">
                Settlement not found. Check the recovery link and try again.
              </p>
            ) : deepLinkState === "inaccessible" ? (
              <p className="text-sm text-muted-foreground">
                This settlement is unavailable to this wallet.
              </p>
            ) : deepLinkState === "unavailable" ? (
              <p className="text-sm text-muted-foreground">
                Settlement service is temporarily unavailable. Try the recovery
                link again shortly.
              </p>
            ) : (
              <SettlementStatus copy={copy} />
            )}
          </div>

          {saleId ? (
            <section
              aria-labelledby="payment-preflight-title"
              className="mt-5 rounded-lg border bg-background/55 p-4"
            >
              <h3 id="payment-preflight-title" className="text-sm font-medium">
                Before you pay
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                <li>
                  {account
                    ? "Buyer wallet is connected."
                    : "Connect the reserved buyer wallet before paying."}
                </li>
                <li>Payment uses Sepolia test USDC.</li>
                <li>Ownership settles on Creditcoin CC3.</li>
                <li>
                  The exact amount and recipient must match this reservation.
                </li>
              </ul>
            </section>
          ) : null}

          <div className="mt-7 space-y-3">
            {deepLinkState === "idle" ? (
              <Button
                className="min-h-11 w-full"
                disabled={Boolean(pending)}
                onClick={() => setAuthIntent("reserve")}
              >
                {pending === "reserve" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Wallet />
                )}
                Connect & reserve live RWA
              </Button>
            ) : !settlementBlocked &&
              !account &&
              settlement?.saleStatus === "OPEN" &&
              !settlement.payment ? (
              <Button
                className="min-h-11 w-full"
                disabled={Boolean(pending)}
                onClick={() => setAuthIntent("pay")}
              >
                {pending === "pay" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Wallet />
                )}
                Connect wallet to pay
              </Button>
            ) : canPay ? (
              <Button
                className="min-h-11 w-full"
                disabled={Boolean(pending) || insufficient}
                onClick={() => void pay()}
              >
                {pending === "pay" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ReceiptText />
                )}
                Pay 1.00 test USDC
              </Button>
            ) : !settlementBlocked ? (
              <div className="flex items-center gap-3 rounded-lg border bg-background/60 p-4 text-sm">
                {settlement?.settlement ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <LoaderCircle className="size-5 animate-spin text-primary" />
                )}
                <span>
                  {settlement?.settlement
                    ? "Settlement verified on Creditcoin."
                    : "Waiting for the next verified protocol state."}
                </span>
              </div>
            ) : null}
            {insufficient ? (
              <p className="text-xs leading-5 text-destructive">
                Insufficient Sepolia test USDC.{" "}
                <a
                  className="underline"
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open faucet <ExternalLink className="inline size-3" />
                </a>
              </p>
            ) : null}
            {saleId ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/tx/${saleId}`}>Save recovery page</Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-7 grid gap-2 sm:grid-cols-3">
            <Evidence
              label="CC3 escrow"
              value={sale?.creationTxHash}
              href={
                sale?.creationTxHash
                  ? `https://creditcoin-testnet.blockscout.com/tx/${sale.creationTxHash}`
                  : undefined
              }
              icon={Landmark}
            />
            <Evidence
              label="Source payment"
              value={settlement?.payment?.sourceTxHash}
              href={
                settlement?.payment?.sourceTxHash
                  ? `https://sepolia.etherscan.io/tx/${settlement.payment.sourceTxHash}`
                  : undefined
              }
              icon={ReceiptText}
            />
            <Evidence
              label="Settlement"
              value={settlement?.settlement?.creditcoinTxHash}
              href={
                settlement?.settlement?.creditcoinTxHash
                  ? `https://creditcoin-testnet.blockscout.com/tx/${settlement.settlement.creditcoinTxHash}`
                  : undefined
              }
              icon={ShieldCheck}
            />
          </div>
        </section>
      </div>

      {error ? (
        <Alert
          variant="destructive"
          className="m-5 mt-0 sm:m-6 sm:mt-0"
          role="alert"
        >
          <AlertCircle />
          <AlertTitle>Action needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Sheet
        open={authIntent !== undefined}
        onOpenChange={(open) => !open && setAuthIntent(undefined)}
      >
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Authenticate your wallet</SheetTitle>
            <SheetDescription className="leading-6">
              This signature only authenticates your wallet and creates a
              session. It does not send a transaction or move assets. If you
              cancel, no RWA is reserved and no payment is made.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={() => void continueAuthentication()}>
              Continue to wallet signature
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="block text-sm">{value}</strong>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="hash text-right">{value}</span>
    </div>
  );
}

function Evidence({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | undefined;
  href: string | undefined;
  icon: LucideIcon;
}) {
  const content = (
    <>
      <Icon className="size-3.5 text-primary" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-xs">{short(value)}</p>
    </>
  );
  return href ? (
    <a
      className="min-w-0 rounded-md border bg-background/70 p-3 transition-colors hover:bg-background"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  ) : (
    <div className="min-w-0 rounded-md border bg-background/70 p-3">
      {content}
    </div>
  );
}
