import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Trust center" };

export default function TrustPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell py-14" tabIndex={-1}>
        <p className="technical-label">TRUST CENTER</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Testnet settlement, explained plainly.
        </h1>
        <div className="mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
          <section className="rounded-lg border p-5">
            <h2 className="font-medium">Testnet only</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Credo is a testnet demonstration. Do not use production assets or
              rely on it for production-value settlement.
            </p>
          </section>
          <section className="rounded-lg border p-5">
            <h2 className="font-medium">Need help?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Report a settlement issue to support@credo.becoder.xyz with the
              sale ID and transaction hash. Never send private keys or seed
              phrases.
            </p>
          </section>
        </div>
        <nav
          className="mt-8 flex flex-wrap gap-3 text-sm"
          aria-label="Trust information"
        >
          <Link className="underline" href="/privacy">
            Privacy
          </Link>
          <Link className="underline" href="/terms">
            Terms
          </Link>
          <Link className="underline" href="/status">
            System status
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
