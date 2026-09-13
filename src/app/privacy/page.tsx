import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="container-shell max-w-3xl py-14"
        tabIndex={-1}
      >
        <p className="technical-label">PRIVACY</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Testnet data handling
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            Credo uses your wallet address and wallet signature to authenticate
            a session. A signature is not a transaction and cannot transfer
            assets.
          </p>
          <p>
            We retain sale identifiers, payment transaction hashes, proof job
            status, and settlement transaction hashes so a settlement can be
            recovered after a browser closes.
          </p>
          <p>
            This testnet service is not intended for sensitive personal data. Do
            not submit private keys, seed phrases, or production credentials.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
