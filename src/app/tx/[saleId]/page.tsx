import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Settlement status" };
export default async function TransactionPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell py-14" tabIndex={-1}>
        <Button asChild variant="ghost" size="sm" className="mb-8">
          <Link href="/playground">
            <ArrowLeft />
            Back to Playground
          </Link>
        </Button>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border bg-card/30">
          <header className="border-b p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="technical-label">RECOVERABLE SETTLEMENT STATUS</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                  Sale {saleId.slice(0, 10)}…
                </h1>
              </div>
              <Badge
                variant="outline"
                className="border-primary/25 text-primary"
              >
                <Check /> SETTLED
              </Badge>
            </div>
          </header>
          <div className="grid gap-px bg-border sm:grid-cols-3">
            <Stat icon={<Check />} label="Sale status" value="SETTLED" />
            <Stat icon={<ShieldCheck />} label="Replay marker" value="TRUE" />
            <Stat icon={<Clock3 />} label="Observed latency" value="489 SEC" />
          </div>
          <div className="p-6 sm:p-8">
            <h2 className="font-medium">Ownership settled</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This recovery view is addressable by sale ID. In production it
              reads the combined settlement endpoint, so closing the original
              browser tab never requires another payment.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href="https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96"
                  target="_blank"
                  rel="noreferrer"
                >
                  Creditcoin settlement <ExternalLink />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sepolia payment <ExternalLink />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card p-5">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <p className="mt-5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xs">{value}</p>
    </div>
  );
}
