import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Infrastructure Docs",
  description: "Builder documentation for Credo.",
};
const sections = [
  {
    group: "Get started",
    links: [
      ["Overview", "overview"],
      ["Quickstart", "quickstart"],
      ["Before you integrate", "prerequisites"],
      ["Active deployment", "deployment"],
    ],
  },
  {
    group: "Core protocol",
    links: [
      ["Integration path", "integration"],
      ["Sale lifecycle", "lifecycle"],
      ["API reference", "api"],
      ["Parameter reference", "parameters"],
      ["Contract ABI", "abi"],
      ["Protocol limits", "limits"],
    ],
  },
  {
    group: "Reference",
    links: [
      ["Security model", "security"],
      ["Errors & recovery", "errors"],
      ["Explicit non-goals", "non-goals"],
    ],
  },
];
const contracts = [
  {
    name: "SettleRWA",
    address: "0x643e070304b7ae9Eed815A7976AA83217206b64a",
    transaction:
      "https://creditcoin-testnet.blockscout.com/tx/0x80822e27d00dbf9f9ec57a6daff6447b05f70ae58726965d5de58be48cd13f89",
  },
  {
    name: "PaymentVerifierUSC",
    address: "0x89df0af9C61D9636d1f67748D863f9AfC741EcfF",
    transaction:
      "https://creditcoin-testnet.blockscout.com/tx/0x91cb37733e53f1981e93c7df4638ef2b3d772dc0045ee12bc1a58721fce98e55",
  },
  {
    name: "TestRWA",
    address: "0xEe1e1D277d011157dAC95F59189E9d5877668284",
    transaction:
      "https://creditcoin-testnet.blockscout.com/tx/0xfd436fa3e965b8e66d22f72887349c45136a77e519b6f419899c209da8175ffd",
  },
];
const officialSepoliaUsdc = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export default function InfraPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[250px_minmax(0,760px)_190px] lg:justify-center">
        <aside className="hidden border-r px-6 py-10 lg:block">
          <DocsNav />
        </aside>
        <main className="min-w-0 px-5 py-10 sm:px-10 lg:px-12">
          <details className="mb-8 rounded-md border bg-card p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">
              Documentation navigation
            </summary>
            <div className="mt-5">
              <DocsNav />
            </div>
          </details>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span>Docs</span>
            <span>/</span>
            <span>Protocol</span>
            <span>/</span>
            <span className="text-foreground">Overview</span>
          </div>
          <h1
            id="overview"
            className="mt-6 scroll-mt-28 text-4xl font-semibold tracking-[-.05em] sm:text-5xl"
          >
            Protocol overview
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Credo is a proof-triggered delivery-versus-payment settlement layer.
            Official USDC remains final on Ethereum, the ERC-1155 remains on
            Creditcoin, and only cryptographic evidence crosses chains.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard
              title="Payment rail"
              body="Official USDC on Sepolia. No wrapper, pool, or bridge custody."
            />
            <InfoCard
              title="Settlement rail"
              body="ERC-1155 escrow and deterministic release on Creditcoin CC3."
            />
          </div>
          <blockquote className="my-9 rounded-r-md border-l-2 border-primary bg-primary/5 p-5 text-sm leading-6">
            <strong className="text-primary">Trust boundary:</strong> The worker
            discovers transactions. Attestcoin proves receipts. The contract
            independently decides.
          </blockquote>
          <DocHeading id="quickstart">Quickstart</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            A Credo integration has two wallet roles. The seller creates and
            escrows the RWA on Creditcoin; the bound buyer pays official USDC on
            Sepolia. The recommended API-assisted path validates parameters and
            indexes the sale, while both users still sign their own wallet
            transactions.
          </p>
          <ol className="mt-5 space-y-3">
            {[
              "Authenticate the seller wallet using the nonce and verify endpoints.",
              "Approve SettleRWA to transfer the seller’s ERC-1155 asset.",
              "Prepare the sale, then submit the returned createSale call from the seller wallet.",
              "Index the confirmed Creditcoin transaction with its saleId.",
              "Authenticate the buyer wallet, show the exact payment instruction, and register the confirmed Sepolia transaction hash.",
              "Poll the settlement resource until the sale settles or the proof reaches a retryable or permanent error.",
            ].map((x, i) => (
              <li
                key={x}
                className="flex gap-4 rounded-md border bg-card/40 p-4 text-sm leading-6"
              >
                <span className="font-mono text-primary">{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
          <CodeBlock>{`// 1. Prepare a sale as the authenticated seller
const prepared = await fetch("/api/v1/sales/prepare", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    buyer: "0xBuyer...",
    assetContract: "0xYourERC1155...",
    tokenId: "1",
    assetAmount: "1",
    paymentNetwork: "sepolia",
    paymentRecipient: "0xSeller...",
    // Decimal USDC with exactly 6 fraction digits; the response returns raw units.
    paymentAmount: "25.000000"
  })
}).then(r => r.json());

// 2. Preserve this exact argument order for the contract call.
const args = [
  prepared.params.buyer,
  prepared.params.assetContract,
  BigInt(prepared.params.tokenId),
  BigInt(prepared.params.assetAmount),
  BigInt(prepared.params.paymentChainKey),
  BigInt(prepared.params.paymentChainId),
  prepared.params.paymentToken,
  prepared.params.paymentRecipient,
  BigInt(prepared.params.paymentAmount),
  BigInt(prepared.params.sourceStartBlock),
  BigInt(prepared.params.sourceEndBlock)
];
// Send createSale(args) to prepared.contract from the seller on CC3.

// 3. After SaleCreated, register the confirmed transaction
await fetch("/api/v1/sales/index", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ saleId, creationTxHash })
});`}</CodeBlock>
          <DocHeading id="prerequisites">Before you integrate</DocHeading>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard
              title="Asset"
              body="An ERC-1155 on Creditcoin CC3 that is already on the operator-managed allowlist, plus seller balance and approval for SettleRWA."
            />
            <InfoCard
              title="Wallets"
              body="Distinct seller and buyer EVM addresses. The payment recipient must be the authenticated seller."
            />
            <InfoCard
              title="Payment"
              body={`Official Sepolia USDC ${officialSepoliaUsdc}. API amounts are decimal USDC; contract amounts are 6-decimal raw units.`}
            />
            <InfoCard
              title="Networks"
              body="Creditcoin CC3 (102031) for the RWA and Sepolia (11155111) for payment."
            />
          </div>
          <DocHeading id="deployment">Active deployment</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            The following v3 testnet deployment is the canonical integration
            target. Bytecode and configuration were verified through CC3 RPC;
            Blockscout source publication is still pending, so this is not a
            production-value deployment.
          </p>
          <div className="mt-5 overflow-hidden rounded-md border">
            {contracts.map(({ name, address, transaction }) => (
              <div
                key={name}
                className="grid gap-2 border-b p-4 last:border-0 sm:grid-cols-[180px_1fr_auto]"
              >
                <span className="text-xs text-muted-foreground">{name}</span>
                <code className="hash overflow-hidden text-ellipsis text-xs">
                  {address}
                </code>
                <a
                  href={transaction}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Deployment tx
                </a>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">CC3 · 102031</Badge>
            <Badge variant="secondary">Sepolia · 11155111</Badge>
            <Badge variant="secondary">Attestcoin · key 1</Badge>
          </div>
          <DocHeading id="integration">Integration path</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Use the API-assisted path below for validation, authentication, and
            worker tracking. A direct-contract integration may call the same
            ABI, but must calculate every raw value and source block itself and
            still index the resulting sale before using Credo&apos;s payment
            API.
          </p>
          <ol className="mt-5 space-y-3">
            {[
              "Verify the deployment manifest and explorer transactions.",
              "Ask the deployment operator to add the ERC-1155 through configureAsset; there is no public self-service endpoint today.",
              "Approve SettleRWA as the ERC-1155 operator.",
              "Call createSale with the Buyer and exact payment tuple.",
              "Index SaleCreated. Settlement continues automatically after payment.",
            ].map((x, i) => (
              <li
                key={x}
                className="flex gap-4 rounded-md border bg-card/40 p-4 text-sm leading-6"
              >
                <span className="font-mono text-primary">0{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
          <DocHeading id="lifecycle">Sale lifecycle</DocHeading>
          <pre className="mt-5 overflow-x-auto rounded-md border bg-card p-5 font-mono text-xs leading-7 text-muted-foreground">
            <code>
              <span className="text-primary">OPEN</span>
              {
                "\n  ↓ exact official USDC Transfer\nPAYMENT FOUND\n  ↓ receipt + continuity proof\nVALIDATING\n  ↓ exact on-chain verification\n"
              }
              <span className="text-primary">SETTLED</span>
            </code>
          </pre>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Registering a payment returns <code>202 Accepted</code>. This means
            proof processing has started, not that settlement has completed.
            Poll <code>GET /api/v1/sales/:saleId/settlement</code>. The sale
            status is <code>OPEN</code>, <code>SETTLED</code>, or{" "}
            <code>RECLAIMED</code>. Payment/proof processing may report{" "}
            <code>RETRYABLE_ERROR</code> or <code>PERMANENT_REJECTION</code>;
            those are not sale statuses.
          </p>
          <DocHeading id="api">API reference</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            All request bodies are strict JSON. Protected endpoints use the
            HTTP-only session cookie created by wallet authentication.
          </p>
          <div className="mt-5 divide-y rounded-md border">
            {[
              [
                "POST",
                "/api/v1/auth/nonce",
                "Create a five-minute wallet signing challenge.",
              ],
              [
                "POST",
                "/api/v1/auth/verify",
                "Verify the signature and create a 15-minute session.",
              ],
              [
                "POST",
                "/api/v1/sales/prepare",
                "Validate inputs and return the Creditcoin createSale call.",
              ],
              [
                "POST",
                "/api/v1/sales/index",
                "Index a confirmed SaleCreated transaction.",
              ],
              [
                "GET",
                "/api/v1/sales/:saleId",
                "Read sale, asset, payment, window, and current status.",
              ],
              [
                "GET",
                "/api/v1/sales/:saleId/payment-instruction",
                "Get the exact USDC transfer parameters.",
              ],
              [
                "POST",
                "/api/v1/sales/:saleId/payment",
                "As the authenticated bound buyer, register the confirmed Sepolia transaction.",
              ],
              [
                "GET",
                "/api/v1/sales/:saleId/settlement",
                "Read sale, payment, proof, query ID, and Creditcoin settlement status.",
              ],
            ].map(([method, path, description]) => (
              <div
                key={`${method}-${path}`}
                className="grid gap-2 p-4 text-xs sm:grid-cols-[48px_260px_1fr]"
              >
                <Badge variant="secondary" className="w-fit font-mono">
                  {method}
                </Badge>
                <code className="break-all">{path}</code>
                <span className="text-muted-foreground">{description}</span>
              </div>
            ))}
          </div>
          <CodeBlock>{`// Authenticate the buyer wallet through /auth/nonce and /auth/verify.
// The resulting HTTP-only cookie must be sent with this request.

// Buyer: fetch the exact payment tuple
const instruction = await fetch(
  \`/api/v1/sales/\${saleId}/payment-instruction\`
).then(r => r.json());

// Transfer instruction.amountRaw to instruction.recipient using
// instruction.token on instruction.chainId, then register its hash.
await fetch(\`/api/v1/sales/\${saleId}/payment\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sourceTxHash })
});

const state = await fetch(
  \`/api/v1/sales/\${saleId}/settlement\`
).then(r => r.json());`}</CodeBlock>
          <DocHeading id="parameters">Parameter reference</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            The prepare endpoint builds a default payment window of 7,200 blocks
            from the next Sepolia block. JSON integer values remain decimal
            strings; convert them to <code>BigInt</code> only when encoding the
            Creditcoin transaction. Attestcoin chain key <code>1</code>{" "}
            identifies the proof source, while EVM chain ID{" "}
            <code>11155111</code> identifies Sepolia. They are different fields
            and are not interchangeable.
          </p>
          <div className="mt-5 divide-y rounded-md border">
            {[
              [
                "buyer",
                "address",
                "Non-zero address; must be different from the authenticated seller.",
              ],
              [
                "assetContract",
                "address",
                "ERC-1155 approved by the operator-managed allowlist.",
              ],
              [
                "tokenId",
                "uint256",
                "Unsigned decimal string; seller must own the requested token.",
              ],
              [
                "assetAmount",
                "uint256",
                "Positive unsigned decimal string within the seller balance.",
              ],
              [
                "paymentChainKey",
                "uint64",
                "1 for the Sepolia Attestcoin proof source.",
              ],
              [
                "paymentChainId",
                "uint64",
                "11155111 for Sepolia; must match the configured chain key.",
              ],
              [
                "paymentToken",
                "address",
                `Official Sepolia USDC: ${officialSepoliaUsdc}.`,
              ],
              [
                "paymentRecipient",
                "address",
                "Must equal the authenticated seller wallet.",
              ],
              [
                "paymentAmount",
                "uint256",
                "Exact 6-decimal raw USDC amount; positive and tuple-unique while open.",
              ],
              [
                "sourceStartBlock",
                "uint64",
                "First accepted Sepolia payment block, inclusive.",
              ],
              [
                "sourceEndBlock",
                "uint64",
                "Last accepted block, inclusive; after start and at most 50,000 blocks away.",
              ],
            ].map(([name, type, rule]) => (
              <div
                key={name}
                className="grid gap-2 p-4 text-xs sm:grid-cols-[150px_90px_1fr]"
              >
                <code>{name}</code>
                <span className="text-primary">{type}</span>
                <span className="text-muted-foreground">{rule}</span>
              </div>
            ))}
          </div>
          <DocHeading id="abi">Contract ABI</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Use the ABI to encode contract calls, decode events, and read sale
            state. Most frontend integrations only need the public sale
            functions and events below; the complete compiler-generated ABIs are
            available for tooling and contract verification.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <a
              href="/abi/SettleRWA.json"
              download
              className="flex items-center justify-between rounded-md border bg-card/40 p-4 text-sm hover:bg-card"
            >
              <span>
                <strong className="block font-medium">SettleRWA ABI</strong>
                <small className="text-muted-foreground">
                  Primary integration contract
                </small>
              </span>
              <Download className="size-4 text-primary" />
            </a>
            <a
              href="/abi/PaymentVerifierUSC.json"
              download
              className="flex items-center justify-between rounded-md border bg-card/40 p-4 text-sm hover:bg-card"
            >
              <span>
                <strong className="block font-medium">
                  PaymentVerifierUSC ABI
                </strong>
                <small className="text-muted-foreground">
                  Proof verification contract
                </small>
              </span>
              <Download className="size-4 text-primary" />
            </a>
            <a
              href="/abi/TestRWA.json"
              download
              className="flex items-center justify-between rounded-md border bg-card/40 p-4 text-sm hover:bg-card"
            >
              <span>
                <strong className="block font-medium">TestRWA ABI</strong>
                <small className="text-muted-foreground">
                  Demo ERC-1155 contract
                </small>
              </span>
              <Download className="size-4 text-primary" />
            </a>
          </div>
          <CodeBlock>{`import { parseAbi } from "viem";

export const settleRwaAbi = parseAbi([
  "function createSale(address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock) returns (bytes32 saleId)",
  "function getSale(bytes32 saleId) view returns ((address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
  "function reclaim(bytes32 saleId)",
  "event SaleCreated(bytes32 indexed saleId,address indexed seller,address indexed buyer,bytes32 paymentTuple)",
  "event AssetEscrowed(bytes32 indexed saleId,address indexed asset,uint256 tokenId,uint256 amount)",
  "event SaleSettled(bytes32 indexed saleId,address indexed buyer,address indexed seller,bytes32 queryId,uint64 sourceBlock)",
  "event AssetReclaimed(bytes32 indexed saleId,address indexed seller,address indexed asset,uint256 tokenId,uint256 amount)"
]);`}</CodeBlock>
          <DocHeading id="limits">Protocol limits</DocHeading>
          <div className="mt-5 divide-y rounded-md border">
            {[
              ["Maximum source window", "50,000 blocks"],
              ["Reclaim safety grace", "24 hours + source window"],
              ["Estimated source block time", "12 seconds"],
              ["Observed v3 latency", "489 seconds"],
              ["Stale worker recovery", "60 seconds"],
            ].map(([a, b]) => (
              <div key={a} className="flex justify-between gap-6 p-4 text-xs">
                <span className="text-muted-foreground">{a}</span>
                <code>{b}</code>
              </div>
            ))}
          </div>
          <DocHeading id="security">Security model</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Settlement binds the source chain key, block window, official token
            emitter, designated Buyer, recipient, exact raw amount, successful
            receipt status, and a globally unused query ID.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            An open sale reserves its exact payment tuple so the same intended
            payment cannot back two active sales. The worker has no settlement
            authority: anyone may submit evidence, but only a proof accepted by
            the native verifier can release escrow. The operator can allowlist
            assets and pause new sales, but cannot force an existing sale to
            settle or redirect its asset.
          </p>
          <blockquote className="mt-5 rounded-r-md border-l-2 border-primary bg-primary/5 p-5 text-sm leading-6">
            <strong className="text-primary">Non-atomic settlement:</strong> A
            Sepolia payment is irreversible before Creditcoin release completes.
            The reclaim deadline covers the source payment window plus a 24-hour
            grace so the seller cannot reclaim during the expected proof period.
          </blockquote>
          <DocHeading id="errors">Errors &amp; recovery</DocHeading>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Error responses use{" "}
            <code>{`{ error: { code, message, requestId } }`}</code>. Log the
            request ID for support and branch on the stable code, not the
            human-readable message.
          </p>
          <div className="mt-5 divide-y rounded-md border">
            {[
              [
                "400",
                "INVALID_SCHEMA",
                "Fix the request shape or decimal-string fields.",
              ],
              [
                "401",
                "NOT_AUTHENTICATED / SESSION_EXPIRED",
                "Repeat wallet authentication.",
              ],
              [
                "403",
                "*_WALLET_MISMATCH",
                "Connect the seller or buyer bound to the sale.",
              ],
              [
                "404",
                "SALE_NOT_FOUND",
                "Check the saleId or wait until indexing completes.",
              ],
              [
                "410",
                "SALE_NOT_OPEN / SALE_NOT_PAYABLE",
                "Stop payment; the sale is terminal.",
              ],
              [
                "422",
                "INVALID_SALE_TRANSACTION",
                "Verify chain, contract, receipt success, and SaleCreated event.",
              ],
              [
                "503",
                "*_NOT_CONFIGURED",
                "The deployment is unavailable; retry only after operator recovery.",
              ],
            ].map(([status, code, action]) => (
              <div
                key={`${status}-${code}`}
                className="grid gap-2 p-4 text-xs sm:grid-cols-[44px_210px_1fr]"
              >
                <code className="text-primary">{status}</code>
                <code>{code}</code>
                <span className="text-muted-foreground">{action}</span>
              </div>
            ))}
          </div>
          <DocHeading id="non-goals">Explicit non-goals</DocHeading>
          <ul className="mt-5 space-y-3">
            {[
              "No asset bridge or wrapped USDC.",
              "No settlement authority granted to the worker; contracts trust verified proof only.",
              "No immediate Seller cancellation.",
              "No claim of a simultaneous two-chain atomic swap.",
              "No production-value guarantee for this testnet deployment.",
            ].map((x) => (
              <li key={x} className="flex gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-14 grid gap-3 border-t pt-7 sm:grid-cols-2">
            <Link
              href="/"
              className="rounded-md border p-4 text-sm hover:bg-card"
            >
              <span className="block text-xs text-muted-foreground">
                Previous
              </span>
              <span className="mt-2 flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Introduction
              </span>
            </Link>
            <Link
              href="/playground"
              className="rounded-md border p-4 text-right text-sm hover:bg-card"
            >
              <span className="block text-xs text-muted-foreground">Next</span>
              <span className="mt-2 flex items-center justify-end gap-2">
                Run the flow
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>
        </main>
        <aside className="hidden border-l px-6 py-10 xl:block">
          <div className="sticky top-26">
            <p className="text-xs font-medium">On this page</p>
            <nav className="mt-4 space-y-3 text-xs text-muted-foreground">
              {[
                ["Overview", "overview"],
                ["Quickstart", "quickstart"],
                ["Prerequisites", "prerequisites"],
                ["Deployment", "deployment"],
                ["Integration", "integration"],
                ["Lifecycle", "lifecycle"],
                ["API", "api"],
                ["Parameters", "parameters"],
                ["ABI", "abi"],
                ["Limits", "limits"],
                ["Security", "security"],
                ["Errors", "errors"],
                ["Non-goals", "non-goals"],
              ].map(([a, b]) => (
                <a
                  key={b}
                  className="block hover:text-foreground"
                  href={`#${b}`}
                >
                  {a}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocsNav() {
  return (
    <nav className="sticky top-26 space-y-7">
      {sections.map((s) => (
        <div key={s.group}>
          <p className="mb-3 text-xs font-medium">{s.group}</p>
          <div className="space-y-2.5">
            {s.links.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`block border-l pl-3 text-xs ${id === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border bg-card/40 p-5">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-5 overflow-x-auto rounded-md border bg-card p-5 font-mono text-xs leading-6 text-muted-foreground">
      <code>{children}</code>
    </pre>
  );
}
function DocHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mt-14 scroll-mt-28 border-t pt-10 text-2xl font-semibold tracking-[-.035em]"
    >
      {children}
    </h2>
  );
}
