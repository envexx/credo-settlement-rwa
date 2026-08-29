import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { RecoveryStatus } from "@/components/recovery-status";

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
            <p className="technical-label">RECOVERABLE SETTLEMENT STATUS</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Sale {saleId.slice(0, 10)}…
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This page reads durable settlement state. You can close the
              original tab without making another payment.
            </p>
          </header>
          <RecoveryStatus saleId={saleId} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
