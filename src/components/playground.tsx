"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  CircleDot,
  Code2,
  ExternalLink,
  Fingerprint,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SaleStatus =
  | "DRAFT"
  | "OPEN"
  | "PAYMENT_CONFIRMED"
  | "WAITING_ATTESTATION"
  | "PROOF_READY"
  | "SETTLED";
type Sale = {
  id: string;
  status: SaleStatus;
  buyer: string;
  seller: string;
  paymentToken: string;
  paymentAmount: string;
  assetId: string;
  sourceBlockStart: number;
  sourceBlockEnd: number;
  sourceTxHash?: string;
  sourceBlock?: number;
  queryId?: string;
  creditcoinTxHash?: string;
};
type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

const stages: Array<{ status: SaleStatus; label: string; network: string }> = [
  { status: "DRAFT", label: "Configure", network: "Application" },
  { status: "OPEN", label: "Escrow", network: "Creditcoin" },
  { status: "PAYMENT_CONFIRMED", label: "Pay", network: "Sepolia" },
  { status: "WAITING_ATTESTATION", label: "Observe", network: "Attestcoin" },
  { status: "PROOF_READY", label: "Verify", network: "Creditcoin" },
  { status: "SETTLED", label: "Release", network: "Creditcoin" },
];
const stageCopy: Record<
  SaleStatus,
  { title: string; body: string; action?: [string, string] }
> = {
  DRAFT: {
    title: "Sale terms are ready to sign",
    body: "The seller selected one ERC-1155, one buyer, 5.00 official USDC, and a 7,200-block Sepolia payment window.",
    action: ["CREATE", "Create sale & lock asset"],
  },
  OPEN: {
    title: "Asset is locked for one buyer",
    body: "Escrow now holds RWA #1001. Only the exact payment tuple shown here can unlock it.",
    action: ["PAY", "Simulate official USDC payment"],
  },
  PAYMENT_CONFIRMED: {
    title: "Sepolia receipt detected",
    body: "The transfer succeeded inside the payment window. The worker can observe it, but cannot authorize release.",
    action: ["ATTEST", "Start Attestcoin proof"],
  },
  WAITING_ATTESTATION: {
    title: "Attestcoin is proving continuity",
    body: "The simulation checks receipt inclusion and advances the attested chain height toward block 11,566,178.",
    action: ["PROVE", "Complete receipt proof"],
  },
  PROOF_READY: {
    title: "Every payment field matches",
    body: "The proof binds chain, token, payer, recipient, raw amount, receipt success, and source block.",
    action: ["SETTLE", "Verify & release on CC3"],
  },
  SETTLED: {
    title: "Payment became ownership",
    body: "The buyer balance is now one, escrow is zero, and the accepted query ID cannot be replayed.",
  },
};
const actionSequence = ["CREATE", "PAY", "ATTEST", "PROVE", "SETTLE"];
const paymentExplorer =
  "https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010";
const settlementExplorer =
  "https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96";
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const short = (value?: string) => {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value;
};

export function Playground() {
  const [sale, setSale] = useState<Sale>();
  const [account, setAccount] = useState("");
  const [pending, setPending] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/demo", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Simulation state is unavailable");
        return response.json() as Promise<Sale>;
      })
      .then(setSale)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "Connection failed",
          );
      });
    return () => controller.abort();
  }, []);

  async function requestAction(action: string) {
    const response = await fetch("/api/demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as Sale & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Simulation action failed");
    setSale(data);
    return data;
  }

  async function act(action: string) {
    setPending(true);
    setError("");
    try {
      await requestAction(action);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setPending(false);
    }
  }

  async function runFullSimulation() {
    setPending(true);
    setAutoRunning(true);
    setError("");
    try {
      await requestAction("RESET");
      await wait(500);
      for (const action of actionSequence) {
        await requestAction(action);
        await wait(action === "ATTEST" ? 1000 : 650);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Simulation failed");
    } finally {
      setPending(false);
      setAutoRunning(false);
    }
  }

  async function connect() {
    setError("");
    try {
      const provider = (window as Window & { ethereum?: EthereumProvider })
        .ethereum;
      if (!provider)
        throw new Error(
          "No EVM wallet detected. You can still run the complete guided simulation without a wallet.",
        );
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? "");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Wallet request failed",
      );
    }
  }

  if (!sale)
    return (
      <Card className="grid min-h-112 place-items-center overflow-hidden bg-card/60">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">
            Loading verified scenario…
          </p>
        </div>
      </Card>
    );

  const index = stages.findIndex((stage) => stage.status === sale.status);
  const copy = stageCopy[sale.status];
  const escrowed = index >= 1 && sale.status !== "SETTLED";
  const checks = [
    ["Receipt success", index >= 2],
    ["Official USDC", index >= 2],
    ["Bound buyer", index >= 4],
    ["Exact recipient", index >= 4],
    ["5,000,000 raw units", index >= 4],
    ["Block in window", index >= 4],
  ] as const;
  const events = [
    {
      at: 1,
      label: "SaleCreated + AssetEscrowed",
      network: "CC3",
      detail: `RWA #${sale.assetId} locked`,
    },
    {
      at: 2,
      label: "Transfer",
      network: "SEPOLIA",
      detail: sale.sourceTxHash ? short(sale.sourceTxHash) : "5.00 USDC",
    },
    {
      at: 3,
      label: "Proof requested",
      network: "ATTESTCOIN",
      detail: "Receipt + continuity",
    },
    {
      at: 4,
      label: "PaymentProofAccepted",
      network: "CC3",
      detail: short(sale.queryId),
    },
    {
      at: 5,
      label: "SaleSettled",
      network: "CC3",
      detail: short(sale.creditcoinTxHash),
    },
  ].filter((event) => index >= event.at);

  return (
    <div className="playground-console overflow-hidden rounded-xl border bg-card shadow-[0_30px_100px_rgba(0,0,0,.08)]">
      <header className="border-b bg-foreground px-5 py-4 text-background sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[.15em]">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              GUIDED TESTNET SIMULATION
            </span>
            <span className="hidden h-4 w-px bg-background/20 sm:block" />
            <span className="font-mono text-[10px] text-background/55">
              SCENARIO · VERIFIED V3 SETTLEMENT
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {account ? (
              <Badge className="border-background/15 bg-background/10 text-background">
                <Wallet /> {short(account)}
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
                onClick={() => void connect()}
              >
                <Wallet /> Connect wallet — optional
              </Button>
            )}
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={pending}
              onClick={() => void runFullSimulation()}
            >
              {autoRunning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Play />
              )}
              Run without wallet
            </Button>
          </div>
        </div>
      </header>

      <div className="grid border-b xl:grid-cols-[330px_1fr]">
        <aside className="border-b bg-secondary/35 p-5 xl:border-r xl:border-b-0 xl:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="technical-label">SALE BRIEF</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                Demo RWA #1001
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                One ERC-1155 unit · curated testnet asset
              </p>
            </div>
            <Badge variant="outline">{sale.status.replaceAll("_", " ")}</Badge>
          </div>
          <div className="mt-8 space-y-4">
            <Fact label="Price" value="5.00 USDC" emphasized />
            <Fact label="Buyer" value={short(sale.buyer)} />
            <Fact label="Seller" value={short(sale.seller)} />
            <Fact
              label="Payment window"
              value={`${sale.sourceBlockStart.toLocaleString()}–${sale.sourceBlockEnd.toLocaleString()}`}
            />
            <Fact label="Sale ID" value={short(sale.id)} />
          </div>
          <div className="mt-7 rounded-lg border bg-background/80 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
                <Box className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium">Custody snapshot</p>
                <p className="text-[10px] text-muted-foreground">
                  Updated after each protocol event
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <Balance label="Escrow" value={escrowed ? "1" : "0"} />
              <Balance
                label="Buyer"
                value={sale.status === "SETTLED" ? "1" : "0"}
              />
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="technical-label">CURRENT DECISION</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">
                {copy.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {copy.body}
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / 06
            </span>
          </div>

          <div className="relative mt-10 grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
            <div className="absolute top-4 right-[8%] left-[8%] hidden h-px bg-border lg:block" />
            <div
              className="absolute top-4 left-[8%] hidden h-px bg-primary transition-all duration-700 lg:block"
              style={{ width: `${(index / (stages.length - 1)) * 84}%` }}
            />
            {stages.map((stage, stageIndex) => {
              const complete = stageIndex < index;
              const active = stageIndex === index;
              return (
                <div className="relative z-10" key={stage.status}>
                  <span
                    className={`grid size-8 place-items-center rounded-full border font-mono text-[10px] transition-all ${
                      complete
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-foreground bg-foreground text-background shadow-[0_0_0_5px_var(--accent)]"
                          : "bg-card text-muted-foreground"
                    }`}
                  >
                    {complete ? <Check className="size-3.5" /> : stageIndex + 1}
                  </span>
                  <p className="mt-3 text-xs font-medium">{stage.label}</p>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    {stage.network}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            <DataPanel
              icon={Code2}
              title="What the developer sends"
              rows={[
                ["buyer", short(sale.buyer)],
                ["asset", `ERC-1155 #${sale.assetId} × 1`],
                ["payment", "5.00 USDC / 5,000,000 raw"],
                [
                  "source window",
                  `${sale.sourceBlockStart} → ${sale.sourceBlockEnd}`,
                ],
              ]}
            />
            <DataPanel
              icon={ShieldCheck}
              title="What the protocol verifies"
              rows={checks.map(([label, passed]) => [
                label,
                passed ? "MATCH" : "WAITING",
              ])}
              verified
            />
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-2">
        <section className="border-b p-5 sm:p-6 xl:border-r xl:border-b-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="technical-label">Event stream</p>
              <h3 className="mt-2 text-sm font-medium">
                Cross-chain execution log
              </h3>
            </div>
            <span className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> LIVE STATE
            </span>
          </div>
          <div className="mt-5 min-h-48 space-y-2">
            {events.length ? (
              events.map((event, eventIndex) => (
                <div
                  key={event.label}
                  className="grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-md border bg-secondary/25 p-3"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{event.label}</p>
                    <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">
                      {event.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] text-primary">
                      {event.network}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                      +{eventIndex + 1}.{eventIndex * 7}s
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid min-h-48 place-items-center rounded-md border border-dashed text-center">
                <div>
                  <CircleDot className="mx-auto size-4 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Create the sale to begin the event stream.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="p-5 sm:p-6">
          <p className="technical-label">Receipt checks</p>
          <h3 className="mt-2 text-sm font-medium">
            On-chain release conditions
          </h3>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {checks.map(([label, passed]) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-md border p-3 text-xs transition-colors ${passed ? "border-primary/30 bg-primary/8" : "bg-secondary/20 text-muted-foreground"}`}
              >
                {passed ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {label}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Evidence
              label="Source tx"
              value={short(sale.sourceTxHash)}
              icon={ReceiptText}
            />
            <Evidence
              label="Query ID"
              value={short(sale.queryId)}
              icon={Fingerprint}
            />
            <Evidence
              label="CC3 tx"
              value={short(sale.creditcoinTxHash)}
              icon={Landmark}
            />
          </div>
        </section>
      </div>

      <footer className="border-t bg-secondary/35 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium">
              {autoRunning ? "Executing the full settlement…" : copy.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Simulated actions never request funds or submit a blockchain
              transaction.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {copy.action ? (
              <Button
                disabled={pending}
                onClick={() => void act(copy.action![0])}
              >
                {pending && !autoRunning ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
                {copy.action[1]} <ArrowRight />
              </Button>
            ) : (
              <>
                <Button asChild>
                  <a href={settlementExplorer} target="_blank" rel="noreferrer">
                    View real settlement <ExternalLink />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={paymentExplorer} target="_blank" rel="noreferrer">
                    View source payment <ExternalLink />
                  </a>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => void act("RESET")}
            >
              <RotateCcw /> Reset
            </Button>
          </div>
        </div>
        {error ? (
          <Alert variant="destructive" className="mt-5">
            <AlertCircle />
            <AlertTitle>Action needs attention</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </footer>
    </div>
  );
}

function Fact({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`hash text-right ${emphasized ? "text-base font-semibold text-foreground" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function Balance({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <strong className="block text-xl">{value}</strong>
      <span className="mt-1 block text-[9px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function DataPanel({
  icon: Icon,
  title,
  rows,
  verified,
}: {
  icon: LucideIcon;
  title: string;
  rows: readonly (readonly [string, string])[];
  verified?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-secondary/20 p-4">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Icon className="size-4 text-primary" /> {title}
      </div>
      <div className="mt-4 space-y-2.5">
        {rows.map(([label, value]) => (
          <div
            className="flex items-center justify-between gap-3 text-[10px]"
            key={label}
          >
            <span className="text-muted-foreground">{label}</span>
            <span
              className={`hash text-right ${verified && value === "MATCH" ? "text-primary" : ""}`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Evidence({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-md border bg-background/70 p-3">
      <Icon className="size-3.5 text-primary" />
      <p className="mt-3 text-[9px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-[9px]">{value}</p>
    </div>
  );
}
