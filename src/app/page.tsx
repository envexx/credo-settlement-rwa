import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  Code2,
  FileCode2,
  Fingerprint,
  LockKeyhole,
  Network,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

const paymentTx =
  "https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010";
const settlementTx =
  "https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="credo-landing" tabIndex={-1}>
        <section className="credo-hero">
          <div className="container-shell credo-hero-copy">
            <Badge variant="outline">
              RWA settlement layer · Creditcoin x Attestcoin
            </Badge>
            <h1>
              Verified payment.
              <br />
              <span>Deterministic ownership.</span>
            </h1>
            <p>
              Your buyer pays USDC on Ethereum. Your asset releases itself on
              Creditcoin. No bridge, no wrapper, no trusted worker.
            </p>
            <div className="credo-actions">
              <Button asChild size="lg">
                <Link href="/playground">
                  Run settlement <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/infra">Read the docs</Link>
              </Button>
            </div>
          </div>
          <div className="credo-hero-image" aria-hidden="true" />
        </section>

        <section
          className="container-shell credo-network-grid"
          aria-label="Settlement infrastructure"
        >
          <NetworkCard
            icon={ReceiptText}
            label="Source payment"
            value="Ethereum Sepolia"
            note="Official USDC remains final"
          />
          <NetworkCard
            icon={ShieldCheck}
            label="Payment proof"
            value="Attestcoin"
            note="Inclusion and continuity verified"
          />
          <NetworkCard
            icon={LockKeyhole}
            label="Asset release"
            value="Creditcoin CC3"
            note="ERC-1155 leaves escrow"
            chart
          />
        </section>

        <section id="mechanism" className="container-shell credo-split-section">
          <div className="credo-statement">
            <span className="eyebrow">How it works</span>
            <h2>
              <em>Payment</em> stays put.
              <br />
              Ownership moves
              <br />
              <em>with proof.</em>
            </h2>
            <p>
              Before escrow opens, Credo locks the deal to one buyer, one token,
              one amount, one block window. Nothing else can release it.
            </p>
            <Button asChild>
              <Link href="/playground">
                Try the flow <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="credo-console">
            <div className="credo-console-head">
              <span>Settlement policy</span>
              <Badge variant="secondary">ACTIVE</Badge>
            </div>
            <div className="credo-tags">
              {[
                "Exact token",
                "Bound buyer",
                "Exact amount",
                "Block window",
                "Receipt success",
                "Replay protection",
              ].map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="credo-policy">
              <small>Policy result</small>
              <strong>Release only after every field matches.</strong>
              <code>6 / 6 constraints satisfied</code>
            </div>
            <div className="credo-mini-grid">
              <div>
                <CircleCheck />
                <strong>Verified</strong>
                <span>On-chain decision</span>
              </div>
              <div>
                <Fingerprint />
                <strong>One-use</strong>
                <span>Query ID consumed</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-shell credo-capabilities">
          <div className="credo-center-title">
            <span className="eyebrow">Built for settlement</span>
            <h2>
              Your <em>RWA flow</em>, backed
              <br />
              by verifiable evidence.
            </h2>
          </div>
          <div className="credo-feature-grid">
            <FeatureCard
              className="is-primary"
              icon={ReceiptText}
              title="Exact payment"
              body="The official USDC Transfer must match the bound buyer, recipient, token, and raw amount."
              visual="bars"
            />
            <FeatureCard
              icon={Network}
              title="Proof validation"
              body="Merkle inclusion, chain continuity, receipt success, and the Transfer log are checked together."
              visual="line"
            />
            <FeatureCard
              icon={LockKeyhole}
              title="Escrow control"
              body="The ERC-1155 stays locked until verified settlement or the delayed reclaim window."
              visual="ring"
            />
          </div>
        </section>

        <section className="container-shell credo-journey">
          <div className="credo-journey-intro">
            <h2>
              From listing to settled,
              <br />
              <em>in five stages.</em>
            </h2>
            <p>
              You always know which stage your sale is in—and what happens next,
              even if the browser closes.
            </p>
            <Button asChild>
              <Link href="/infra#quickstart">Integration guide</Link>
            </Button>
          </div>
          <div className="credo-steps">
            {[
              [
                "01",
                "Configure",
                "Choose the ERC-1155, buyer, recipient, and USDC amount.",
              ],
              [
                "02",
                "Escrow",
                "Approve SettleRWA and create the sale on Creditcoin.",
              ],
              [
                "03",
                "Pay",
                "Transfer the exact official USDC amount on Sepolia.",
              ],
              [
                "04",
                "Prove",
                "Build and submit the receipt and continuity proof.",
              ],
              [
                "05",
                "Release",
                "Deliver the asset after independent contract verification.",
              ],
            ].map(([number, title, body]) => (
              <div className="credo-step" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="evidence" className="container-shell credo-evidence">
          <div>
            <span className="eyebrow">Public evidence</span>
            <h2>
              Trust the transaction,
              <br />
              <em>not the promise.</em>
            </h2>
            <p>
              A distinct buyer paid on Sepolia. The active v3 contracts settled
              the asset on Creditcoin.
            </p>
            <div className="credo-proof-links">
              <a href={paymentTx} target="_blank" rel="noreferrer">
                View payment on Sepolia <ArrowUpRight />
              </a>
              <a href={settlementTx} target="_blank" rel="noreferrer">
                View settlement on Creditcoin CC3 <ArrowUpRight />
              </a>
            </div>
          </div>
          <div className="credo-proof-card">
            <div className="credo-proof-head">
              <span>LIVE SETTLEMENT</span>
              <i /> VERIFIED
            </div>
            {[
              ["Observed latency", "489 seconds"],
              ["Buyer RWA balance", "1"],
              ["Escrow balance", "0"],
              ["Replay marker", "true"],
            ].map(([label, value]) => (
              <div className="credo-proof-row" key={label}>
                <span>{label}</span>
                <strong>
                  {value} <Check />
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="container-shell credo-developer">
          <div className="credo-center-title">
            <span className="eyebrow">Developer ready</span>
            <h2>
              Integrate the settlement layer.
              <br />
              <em>Keep your product.</em>
            </h2>
          </div>
          <div className="credo-dev-grid">
            <DevCard
              icon={Code2}
              title="API quickstart"
              body="Authenticate wallets, prepare a sale, index it, and register payment through strict JSON endpoints."
              href="/infra#quickstart"
            />
            <DevCard
              icon={FileCode2}
              title="Contract ABI"
              body="Use compiler-generated SettleRWA and PaymentVerifierUSC ABIs in viem, ethers, or your own tooling."
              href="/infra#abi"
            />
            <DevCard
              icon={ShieldCheck}
              title="Security model"
              body="Understand the exact trust boundary, replay protection, reclaim grace, and protocol non-goals."
              href="/infra#security"
            />
          </div>
        </section>

        <section className="container-shell credo-faq">
          <div>
            <span className="eyebrow">Clear boundaries</span>
            <h2>
              Know exactly
              <br />
              <em>what it does.</em>
            </h2>
          </div>
          <Accordion type="single" collapsible defaultValue="worker">
            {(
              [
                [
                  "worker",
                  "Can the worker fake settlement?",
                  "No. The worker discovers transactions and submits proofs; the contract independently rejects any mismatch.",
                ],
                [
                  "bridge",
                  "Does USDC cross a bridge?",
                  "No. Official USDC stays final on Ethereum Sepolia. Only cryptographic evidence crosses chains.",
                ],
                [
                  "instant",
                  "Is settlement instant?",
                  "No. Attestation takes time. Processing continues independently if the browser closes.",
                ],
                [
                  "production",
                  "Is this production value?",
                  "No. The current deployment demonstrates the mechanism on Sepolia and Creditcoin CC3 testnets.",
                ],
              ] satisfies Array<[string, string, string]>
            ).map(([value, title, body]) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger>{title}</AccordionTrigger>
                <AccordionContent>{body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="container-shell credo-final-cta">
          <span className="eyebrow">Build on Credo</span>
          <h2>
            Move ownership with
            <br />
            <em>verifiable payment.</em>
          </h2>
          <p>
            Every claim on this page links to a real transaction. Start with the
            evidence, end with your first settlement.
          </p>
          <Button asChild size="lg">
            <Link href="/playground">
              Open playground <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function NetworkCard({
  icon: Icon,
  label,
  value,
  note,
  chart,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  chart?: boolean;
}) {
  return (
    <article
      className={chart ? "network-card network-card-wide" : "network-card"}
    >
      <div>
        <Icon />
        <small>{label}</small>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
      {chart ? (
        <div className="network-chart">
          {[3, 4, 3, 6, 5, 8, 4, 7].map((x, i) => (
            <i key={i} style={{ height: `${x * 10}%` }} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
function FeatureCard({
  icon: Icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  visual: "bars" | "line" | "ring";
  className?: string;
}) {
  return (
    <article className={`credo-feature-card ${className}`}>
      <Icon />
      <h3>{title}</h3>
      <p>{body}</p>
      <div className={`feature-visual ${visual}`}>
        {visual === "bars"
          ? [2, 5, 3, 7, 4, 8].map((x, i) => (
              <i key={i} style={{ height: `${x * 10}%` }} />
            ))
          : null}
        {visual === "line" ? (
          <svg viewBox="0 0 300 100" role="img" aria-label="Proof progress">
            <polyline points="0,78 25,72 45,84 70,47 96,61 120,18 145,70 175,54 205,80 230,38 255,55 280,20 300,34" />
          </svg>
        ) : null}
        {visual === "ring" ? <span /> : null}
      </div>
    </article>
  );
}
function DevCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="credo-dev-card">
      <Icon />
      <h3>{title}</h3>
      <p>{body}</p>
      <span>
        Explore <ArrowRight />
      </span>
    </Link>
  );
}
