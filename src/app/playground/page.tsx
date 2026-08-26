import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Playground } from "@/components/playground";

export const metadata: Metadata = {
  title: "Playground",
  description: "Run a realistic guided Credo settlement simulation.",
};
export default function PlaygroundPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-shell py-10 sm:py-14 lg:py-18">
        <div className="mb-9 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="technical-label">Guided testnet simulation</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
              Watch a payment become ownership.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Walk through a realistic Credo settlement from sale configuration
              to ERC-1155 release. Every value mirrors the verified v3 testnet
              run, while simulated actions spend no funds and send no
              transaction.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x rounded-lg border bg-card p-4 text-center">
            <div>
              <strong className="block text-lg">6</strong>
              <span className="text-[9px] text-muted-foreground">STAGES</span>
            </div>
            <div>
              <strong className="block text-lg">3</strong>
              <span className="text-[9px] text-muted-foreground">NETWORKS</span>
            </div>
            <div>
              <strong className="block text-lg">0</strong>
              <span className="text-[9px] text-muted-foreground">
                FUNDS USED
              </span>
            </div>
          </div>
        </div>
        <Playground />
      </main>
      <SiteFooter />
    </>
  );
}
