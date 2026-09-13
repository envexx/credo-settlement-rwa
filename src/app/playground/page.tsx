import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Playground } from "@/components/playground";

export const metadata: Metadata = {
  title: "Playground",
  description: "Reserve a live test RWA and pay 1.00 test USDC on Sepolia.",
};
export default function PlaygroundPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="container-shell py-10 sm:py-14 lg:py-18"
      >
        <div className="mb-9 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="technical-label">Live testnet settlement</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
              Watch a payment become ownership.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Connect one EVM wallet, reserve one live RWA, then pay exactly
              1.00 Sepolia test USDC. Attestcoin proves the receipt before
              Creditcoin releases the asset to your wallet.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x rounded-lg border bg-card p-4 text-center">
            <div>
              <strong className="block text-lg">1</strong>
              <span className="text-xs text-muted-foreground">RWA UNIT</span>
            </div>
            <div>
              <strong className="block text-lg">1.00</strong>
              <span className="text-xs text-muted-foreground">TEST USDC</span>
            </div>
            <div>
              <strong className="block text-lg">8–10m</strong>
              <span className="text-xs text-muted-foreground">
                TYPICAL PROOF
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
