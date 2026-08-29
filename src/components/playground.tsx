"use client";

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

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function transfer(address,uint256) returns(bool)",
]);

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
  if (!response.ok) throw new Error(apiMessage(data, fallback));
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
  saleId: string,
  wallet: string,
) {
  const instruction = await getPaymentInstruction(saleId);
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

function statusCopy(settlement?: Settlement) {
  if (!settlement)
    return {
      title: "Reserve one live test RWA",
      body: "Credo creates the escrow on Creditcoin for your wallet, then you pay exactly 1.00 test USDC on Sepolia.",
    };
  if (settlement.settlement)
    return {
      title: "Payment became ownership",
      body: "The verified proof released TestRWA #1001 directly to your wallet on Creditcoin.",
    };
  if (settlement.proof)
    return {
      title: "Attestcoin proof is in progress",
      body: `Worker status: ${settlement.proof.status.replaceAll("_", " ")}. Settlement typically takes 8–10 minutes.`,
    };
  if (settlement.payment)
    return {
      title: "Payment detected",
      body: "Your Sepolia transfer is durably queued for proof verification.",
    };
  if (settlement.saleStatus === "RECLAIMED")
    return {
      title: "Reservation expired",
      body: "The unpaid asset was returned to demo inventory. Reserve a new live RWA to try again.",
    };
  return {
    title: "RWA is escrowed for your wallet",
    body: "Pay exactly 1.00 test USDC on Sepolia. The payment tuple is locked on-chain.",
  };
}

export function Playground() {
  const [account, setAccount] = useState("");
  const [sale, setSale] = useState<LiveSale>();
  const [settlement, setSettlement] = useState<Settlement>();
  const [balance, setBalance] = useState<bigint>();
  const [pending, setPending] = useState<"reserve" | "pay">();
  const [error, setError] = useState("");

  const saleId = sale?.saleId ?? settlement?.saleId;
  const copy = statusCopy(settlement);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("sale");
    if (!id || !/^0x[a-fA-F0-9]{64}$/.test(id)) return;
    let cancelled = false;
    void getSettlement(id)
      .then((data) => {
        if (!cancelled) setSettlement(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : "Live settlement is unavailable",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
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
  }, [saleId, settlement?.saleStatus, settlement?.settlement]);

  useEffect(() => {
    if (!saleId || !account || settlement?.saleStatus !== "OPEN") return;
    const ethereum = provider();
    if (!ethereum) return;
    let cancelled = false;
    void readUsdcBalance(ethereum, saleId, account)
      .then(({ amount }) => {
        if (!cancelled) setBalance(amount);
      })
      .catch(() => {
        if (!cancelled) setBalance(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [account, saleId, settlement?.saleStatus]);

  async function reserve() {
    setPending("reserve");
    setError("");
    try {
      const ethereum = provider();
      if (!ethereum)
        throw new Error("Install an EVM wallet to reserve a live test RWA.");
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const walletAddress = accounts[0]?.toLowerCase();
      if (!walletAddress) throw new Error("Wallet did not return an account.");
      setAccount(walletAddress);

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
      const created = await responseJson<LiveSale>(
        await fetch("/api/v1/playground/live-sale", { method: "POST" }),
        "Could not reserve a live test RWA",
      );
      setSale(created);
      window.history.replaceState({}, "", `/playground?sale=${created.saleId}`);
      setSettlement(await getSettlement(created.saleId));
      setBalance(
        (await readUsdcBalance(ethereum, created.saleId, walletAddress)).amount,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Live reservation failed",
      );
    } finally {
      setPending(undefined);
    }
  }

  async function pay() {
    if (!saleId || !account) return;
    setPending("pay");
    setError("");
    try {
      const ethereum = provider();
      if (!ethereum)
        throw new Error("Install an EVM wallet to pay with test USDC.");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      const { instruction, amount } = await readUsdcBalance(
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

  const insufficient = balance !== undefined && balance < 1_000_000n;
  const canPay = Boolean(
    account &&
    saleId &&
    settlement?.saleStatus === "OPEN" &&
    !settlement.payment,
  );

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
          <h3 className="mt-3 text-2xl font-semibold tracking-[-.035em]">
            {copy.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {copy.body}
          </p>

          <div className="mt-7 space-y-3">
            {!saleId ? (
              <Button
                className="min-h-11 w-full"
                disabled={Boolean(pending)}
                onClick={() => void reserve()}
              >
                {pending === "reserve" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Wallet />
                )}
                Connect & reserve live RWA
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
            ) : (
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
            )}
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
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="block text-sm">{value}</strong>
      <span className="mt-1 block text-[9px] text-muted-foreground">
        {label}
      </span>
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
      <p className="mt-3 text-[9px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-[9px]">{short(value)}</p>
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
