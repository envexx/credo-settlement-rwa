"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SettlementStatus } from "@/components/settlement-status";
import { settlementPresentation } from "@/lib/settlement-presentation";

type Settlement = {
  saleId: string;
  saleStatus: "OPEN" | "SETTLED" | "RECLAIMED";
  payment: { status: string; sourceTxHash: string } | null;
  proof: { status: string; queryId?: string } | null;
  settlement: {
    creditcoinTxHash: string;
    assetRecipient: string;
    tokenId: string;
  } | null;
};

export function RecoveryStatus({ saleId }: { saleId: string }) {
  const [settlement, setSettlement] = useState<Settlement>();
  const [error, setError] = useState("");
  const copy = useMemo(
    () =>
      settlementPresentation({
        saleStatus: settlement?.saleStatus,
        proofStatus: settlement?.proof?.status,
      }),
    [settlement?.proof?.status, settlement?.saleStatus],
  );

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function refresh() {
      try {
        const response = await fetch(`/api/v1/sales/${saleId}/settlement`, {
          cache: "no-store",
        });
        const data = (await response.json()) as Settlement & {
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(data.error?.message ?? "Settlement is unavailable");
        }
        if (cancelled) return;
        setSettlement(data);
        setError("");
        const next = settlementPresentation({
          saleStatus: data.saleStatus,
          proofStatus: data.proof?.status,
        });
        if (!next.terminal) timer = window.setTimeout(refresh, 15_000);
      } catch (reason) {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Settlement is unavailable",
        );
        timer = window.setTimeout(refresh, 15_000);
      }
    }

    void refresh();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [saleId]);

  if (!settlement && !error) {
    return (
      <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground sm:p-8">
        <LoaderCircle className="size-5 animate-spin" /> Loading settlement
        state…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 sm:p-8">
      {error ? (
        <Alert variant="destructive" role="alert">
          <RefreshCw />
          <AlertTitle>Status temporarily unavailable</AlertTitle>
          <AlertDescription>
            {error}. Credo will retry automatically; do not make a second
            payment.
          </AlertDescription>
        </Alert>
      ) : null}
      {settlement ? <SettlementStatus copy={copy} /> : null}
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <RecoveryFact label="Sale ID" value={saleId} />
        {settlement ? (
          <>
            <RecoveryFact
              label="Proof status"
              value={settlement.proof?.status ?? "Not started"}
            />
            <RecoveryFact
              label="Proof query ID"
              value={settlement.proof?.queryId ?? "Pending"}
            />
            <RecoveryFact
              label="Payment transaction"
              value={settlement.payment?.sourceTxHash ?? "Not submitted"}
            />
            <RecoveryFact
              label="Settlement transaction"
              value={settlement.settlement?.creditcoinTxHash ?? "Pending"}
            />
          </>
        ) : null}
      </dl>
      <div className="flex flex-wrap gap-3">
        {settlement?.payment?.sourceTxHash ? (
          <Button asChild variant="outline">
            <a
              href={`https://sepolia.etherscan.io/tx/${settlement.payment.sourceTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View payment on Sepolia <ExternalLink />
            </a>
          </Button>
        ) : null}
        {settlement?.settlement?.creditcoinTxHash ? (
          <Button asChild>
            <a
              href={`https://creditcoin-testnet.blockscout.com/tx/${settlement.settlement.creditcoinTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View settlement on Creditcoin CC3 <ExternalLink />
            </a>
          </Button>
        ) : null}
        {settlement?.proof?.queryId ? (
          <Button asChild variant="outline">
            <a
              href={`https://creditcoin-testnet.blockscout.com/queryId/${settlement.proof.queryId}`}
              target="_blank"
              rel="noreferrer"
            >
              View proof on Attestcoin <ExternalLink />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function RecoveryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-background/50 p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-all font-mono text-xs">{value}</dd>
    </div>
  );
}
