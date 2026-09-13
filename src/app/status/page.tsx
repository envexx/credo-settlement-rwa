import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "System status" };

export default function StatusPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="container-shell max-w-3xl py-14"
        tabIndex={-1}
      >
        <p className="technical-label">SYSTEM STATUS</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Testnet operating posture
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            This page is not real-time monitoring. It describes the components
            used by the current testnet demonstration: the Credo API, proof
            worker, Ethereum Sepolia, Attestcoin proof service, and Creditcoin
            CC3.
          </p>
          <p>
            If a settlement appears stalled, keep the recovery URL, do not make
            a second payment, and report the sale ID and payment transaction
            hash to support@credo.becoder.xyz.
          </p>
          <p>
            Incidents are assessed from the durable settlement state and the
            linked chain explorers. Planned maintenance or status changes are
            communicated through the project repository until a monitored status
            service is available.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
