import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="container-shell max-w-3xl py-14"
        tabIndex={-1}
      >
        <p className="technical-label">TERMS</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Testnet-only terms
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            Credo is testnet-only software for demonstration and integration
            testing. It provides no production-value guarantee, custody service,
            or financial advice.
          </p>
          <p>
            Testnet payment and asset flows can fail, be reset, or change
            without notice. Verify transaction details in your wallet and the
            linked explorers before relying on any displayed state.
          </p>
          <p>
            By using the playground, you agree not to submit production assets,
            private keys, seed phrases, or personal data unrelated to testnet
            settlement.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
