"""Generate the Credo submission deck (docs/submission/credo-deck.pdf).

Design: dark theme consistent with the Credo landing page (near-black + lime).
Run: uv run --with reportlab --with pillow python scripts/make-deck.py
"""

from __future__ import annotations

import os

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas

W, H = 1280, 720
BG = HexColor("#0A0C0A")
PANEL = HexColor("#121512")
BORDER = HexColor("#232823")
TEXT = HexColor("#E8ECE8")
MUTED = HexColor("#8D978B")
LIME = HexColor("#9FE870")
LIME_DIM = HexColor("#5C8A42")

LOGO_SRC = "public/brands/LOGO.png"
OUT = "docs/submission/credo-deck.pdf"


def trim_logo(src: str, dst: str) -> str:
    img = PILImage.open(src).convert("RGB")
    black = PILImage.new("RGB", img.size, (0, 0, 0))
    bbox = img.getbbox()
    if bbox:
        pad = 8
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(img.width, bbox[2] + pad),
            min(img.height, bbox[3] + pad),
        )
        img = img.crop(bbox)
    img.save(dst)
    return dst


class Deck:
    def __init__(self, path: str, logo: str):
        self.c = canvas.Canvas(path, pagesize=(W, H))
        self.logo = logo
        self.page = 0

    # ---------- primitives ----------
    def new_page(self, label: str) -> None:
        if self.page:
            self.c.showPage()
        self.page += 1
        c = self.c
        c.setFillColor(BG)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        # frame
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.rect(28, 28, W - 56, H - 56, fill=0, stroke=1)
        # header
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(52, H - 48, "CREDO")
        c.setFont("Helvetica", 9)
        c.drawRightString(W - 52, H - 48, label.upper())
        c.setStrokeColor(BORDER)
        c.line(52, H - 58, W - 52, H - 58)
        # footer
        c.setFont("Helvetica", 8)
        c.drawString(52, 40, "BUIDL CTC 2026 Fall · RWA Track · Creditcoin CC3 x Attestcoin")
        c.drawRightString(W - 52, 40, f"{self.page:02d}")

    def save(self) -> None:
        self.c.save()

    def heading(self, kicker: str, title: str) -> None:
        c = self.c
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(64, H - 108, kicker.upper())
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(64, H - 152, title)

    def para(self, x: float, y: float, text: str, width: float, size: int = 13,
             color: HexColor = MUTED, leading: float = 1.45) -> float:
        c = self.c
        c.setFont("Helvetica", size)
        c.setFillColor(color)
        lines = simpleSplit(text, "Helvetica", size, width)
        for ln in lines:
            c.drawString(x, y, ln)
            y -= size * leading
        return y

    def bullets(self, x: float, y: float, items: list[tuple[str, str]],
                width: float, size: int = 13, gap: float = 14) -> float:
        """items: (bold lead, rest)."""
        c = self.c
        for lead, rest in items:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", size)
            marker_x = x
            c.drawString(marker_x, y, "—")
            tx = x + 18
            if lead:
                c.setFillColor(TEXT)
                c.drawString(tx, y, lead + " ")
                tx += c.stringWidth(lead + " ", "Helvetica-Bold", size)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", size)
            avail = width - (tx - x)
            first = simpleSplit(rest, "Helvetica", size, avail)
            if first:
                c.drawString(tx, y, first[0])
                y -= size * 1.42
                for ln in first[1:]:
                    c.drawString(tx, y, ln)
                    y -= size * 1.42
            y -= gap
        return y

    def panel(self, x: float, y: float, w: float, h: float, fill: bool = True) -> None:
        c = self.c
        if fill:
            c.setFillColor(PANEL)
            c.roundRect(x, y, w, h, 12, fill=1, stroke=0)
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.roundRect(x, y, w, h, 12, fill=0, stroke=1)

    def chip(self, x: float, y: float, text: str, fg: HexColor = LIME) -> float:
        c = self.c
        c.setFont("Helvetica-Bold", 10)
        w = c.stringWidth(text, "Helvetica-Bold", 10) + 24
        c.setStrokeColor(BORDER)
        c.setFillColor(PANEL)
        c.roundRect(x, y, w, 26, 13, fill=1, stroke=1)
        c.setFillColor(fg)
        c.drawCentredString(x + w / 2, y + 9, text)
        return x + w + 10

    def link(self, x: float, y: float, w: float, h: float, url: str) -> None:
        self.c.linkURL(url, (x, y, x + w, y + h), relative=0)


def arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float) -> None:
    c.setStrokeColor(LIME_DIM)
    c.setFillColor(LIME_DIM)
    c.setLineWidth(1.4)
    c.line(x1, y1, x2, y2)
    import math

    ang = math.atan2(y2 - y1, x2 - x1)
    for da in (2.6, -2.6):
        c.line(x2, y2, x2 - 10 * math.cos(ang + da), y2 - 10 * math.sin(ang + da))


def flow_slide(d: Deck) -> None:
    d.new_page("How it works")
    d.heading("Mechanism", "One payment. One proof. One release.")
    c = d.c
    y0 = H - 300
    boxes = [
        (64, "SELLER", "createSale", "ERC-1155 enters\nSettleRWA escrow"),
        (303, "BUYER", "pays USDC", "plain transfer on\nSepolia — 1 click"),
        (542, "WORKER", "discovers", "waits attestation,\nbuilds proof (USC SDK)"),
        (781, "VERIFIER", "0x...0FD2", "Merkle + continuity\nverified in-tx"),
        (1020, "RELEASE", "SETTLED", "ERC-1155 leaves\nescrow to buyer"),
    ]
    bw, bh = 196, 118
    for i, (x, tag, title, sub) in enumerate(boxes):
        d.panel(x, y0 - bh, bw, bh)
        c.setFillColor(LIME if i in (3, 4) else MUTED)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(x + 14, y0 - 22, tag)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 14, y0 - 46, title)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9.5)
        for j, ln in enumerate(sub.split("\n")):
            c.drawString(x + 14, y0 - 68 - j * 13, ln)
        if i < len(boxes) - 1:
            arrow(c, x + bw + 4, y0 - bh / 2, x + bw + 35, y0 - bh / 2)
    # bands
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(64, y0 - bh - 34, "ETHEREUM SEPOLIA — payment stays here, final")
    c.drawString(1020, y0 - bh - 34, "CREDITCOIN CC3 — asset stays here, final")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(470, y0 + 40, "ATTESTCOIN PROTOCOL — only this crosses the chains")
    c.setStrokeColor(LIME_DIM)
    c.setLineWidth(1)
    c.line(470, y0 + 30, 830, y0 + 30)
    # bottom takeaway
    d.para(64, y0 - bh - 78,
           "The worker discovers. Attestcoin proves. The contract decides. The blockchain owns the state.",
           1150, size=14, color=TEXT)


def metrics_slide(d: Deck) -> None:
    d.new_page("Live testnet proof")
    d.heading("Evidence", "Settled live on CC3 — with two independent wallets.")
    c = d.c
    stats = [
        ("489 s", "payment → settlement\nlatency, end-to-end"),
        ("2", "independent wallets\n(distinct seller & buyer)"),
        ("1 / 0", "buyer ERC-1155 balance /\nescrow balance, after"),
        ("true", "global replay marker\nset in settlement tx"),
    ]
    x = 64
    for big, small in stats:
        d.panel(x, H - 330, 262, 150)
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 40)
        c.drawString(x + 22, H - 210, big)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 10.5)
        for j, ln in enumerate(small.split("\n")):
            c.drawString(x + 22, H - 240 - j * 15, ln)
        x += 278
    rows = [
        ("Buyer pays 5 USDC on Sepolia", "sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010",
         "https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010"),
        ("Attestcoin proof accepted (queryId 0x4c94e8b1…)", "recorded in docs/evidence/attestcoin/proof-run.json", None),
        ("Settlement executes on Creditcoin", "creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96",
         "https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96"),
    ]
    y = H - 390
    for title, shown, url in rows:
        d.panel(64, y - 16, 1152, 52, fill=False)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(84, y + 2, title)
        c.setFillColor(LIME if url else MUTED)
        c.setFont("Courier", 10)
        c.drawString(84, y - 10, shown)
        if url:
            d.link(64, y - 16, 1152, 52, url)
        y -= 66
    d.para(64, y - 6,
           "Every number on this page was re-verified directly against CC3 RPC during the final audit.",
           1150, size=11)


def attestation_slide(d: Deck) -> None:
    d.new_page("Attestcoin Protocol integration")
    d.heading("Core scoring", "The proof is the only path to settlement.")
    d.bullets(
        64, H - 210,
        [
            ("Synchronous in-transaction verification.",
             "executePaymentProof calls verifyAndEmit on precompile 0x…0FD2 inside the settlement tx — failure reverts everything."),
            ("Receipt decoded from verified bytes.",
             "Official EvmV1Decoder extracts status, emitter, payer, recipient, amount from the attested transaction — never worker claims."),
            ("Exact-match policy.",
             "Exactly one USDC Transfer must match all bound fields; zero or multiple matches revert."),
            ("chainKey ≠ chainId.",
             "Attestcoin key 1 (Sepolia) validated independently from EVM id 11155111."),
            ("Source block window.",
             "Payment height must fall in the sale's ≤50,000-block window — old payments are structurally dead."),
            ("Global replay guard.",
             "queryId = keccak(chainKey, height, txIndex) is one-use; marker + release share one atomic transaction."),
            ("Official SDK in the worker.",
             "@gluwa/usc-sdk ProofBuilder + PrecompileChainInfoProvider against the CC3 proof builder."),
        ],
        1150, size=12.5, gap=10,
    )


def security_slide(d: Deck) -> None:
    d.new_page("Security model")
    d.heading("Trust boundary", "Nobody — including us — can fake a settlement.")
    c = d.c
    d.panel(64, H - 420, 560, 260)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(88, H - 190, "What the contract enforces")
    d.bullets(88, H - 224, [
        ("", "Checks-effects-interactions + ReentrancyGuard"),
        ("", "Non-upgradeable, custom errors only"),
        ("", "One OPEN sale per exact payment tuple"),
        ("", "Release and replay marker in one tx"),
        ("", "Reclaim only after window + 24 h grace"),
    ], 510, size=11.5, gap=8)
    d.panel(656, H - 420, 560, 260)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(680, H - 190, "What the operator cannot do")
    d.bullets(680, H - 224, [
        ("", "Force-settle or redirect escrowed assets"),
        ("", "Mark arbitrary proofs as verified"),
        ("", "Change a sale's buyer after creation"),
        ("", "Cancel a sale after the buyer paid"),
        ("", "Touch funds — worker key holds no roles"),
    ], 510, size=11.5, gap=8)
    d.para(64, H - 470,
           "Honest limitation: the Sepolia payment is irreversible before the Creditcoin release completes — "
           "this is proof-triggered settlement, not an atomic two-chain swap. The reclaim grace period is the "
           "mitigation until reverse write-back ships on the Attestcoin roadmap.",
           1150, size=12, color=TEXT)


def positioning_slide(d: Deck) -> None:
    d.new_page("Positioning")
    d.heading("Settlement layer", "Protocol owns truth. Ecosystem owns experience.")
    c = d.c
    d.panel(64, H - 430, 560, 270)
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(88, H - 200, "CREDO PROTOCOL (this repo)")
    d.bullets(88, H - 234, [
        ("", "Escrow + deterministic release"),
        ("", "Attestcoin proof verification"),
        ("", "Payment-intent uniqueness"),
        ("", "Asset adapter standard (roadmap)"),
        ("", "Worker automation"),
    ], 510, size=11.5, gap=8)
    d.panel(656, H - 430, 560, 270)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(680, H - 200, "ECOSYSTEM (builders invited)")
    d.bullets(680, H - 234, [
        ("", "Marketplaces & listing UIs"),
        ("", "OTC desks"),
        ("", "Issuance & compliance platforms"),
        ("", "Discovery, pricing, analytics"),
        ("", "Any RWA app needing DvP"),
    ], 510, size=11.5, gap=8)
    d.para(64, H - 480,
           "Any application can settle an RWA through the same escrow: approve the contract, call createSale, "
           "and the payment-to-release pipeline runs automatically.",
           1150, size=13, color=TEXT)


def roadmap_slide(d: Deck) -> None:
    d.new_page("Roadmap")
    d.heading("From primitive to standard", "The layer grows without changing the core.")
    c = d.c
    phases = [
        ("NOW", "Settlement primitive", "Live on CC3: escrow, proof, release, replay guard — verified end-to-end.", True),
        ("PHASE B", "Reservation layer", "Listing → buyer reserves → unique payment intent. Kills the double-buyer race; opens multi-buyer.", False),
        ("PHASE C", "Asset adapters + issuance", "IAssetAdapter for ERC-20/721/3643; compliance hooks at the adapter layer.", False),
        ("PHASE D", "Discovery / marketplace", "Index over reservations — escrow stays in SettleRWA; venues never hold assets.", False),
        ("PHASE E", "Atomic two-way DvP", "When Attestcoin ships reverse write-back, refund legs become trustless.", False),
    ]
    y = H - 200
    for tag, title, body, live in phases:
        d.panel(64, y - 64, 1152, 72, fill=live)
        c.setFillColor(LIME if live else LIME_DIM)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(88, y - 22, tag)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(190, y - 24, title)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 11)
        c.drawString(190, y - 46, body)
        if live:
            c.setFillColor(LIME)
            c.setFont("Helvetica-Bold", 10)
            c.drawRightString(1190, y - 24, "● SHIPPED & VERIFIED")
        y -= 84


def closing_slide(d: Deck) -> None:
    d.new_page("Thank you")
    c = d.c
    c.drawImage(d.logo, W / 2 - 60, H - 300, 120, 120, mask="auto")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(W / 2, H - 370, "Move ownership with")
    c.setFillColor(LIME)
    c.drawCentredString(W / 2, H - 420, "verifiable payment.")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 13)
    c.drawCentredString(W / 2, H - 470,
                        "No bridge. No wrapped USDC. No trusted worker.")
    x = W / 2 - 260
    x = d.chip(x, 150, "github.com/<repo>/credo") 
    x = d.chip(x, 150, "Live app: this repo, `npm run dev`")
    d.chip(x, 150, "Credo · BUIDL CTC 2026 Fall")


def main() -> None:
    os.makedirs("docs/submission", exist_ok=True)
    logo = trim_logo(LOGO_SRC, "docs/submission/_logo_trim.png")
    d = Deck(OUT, logo)

    # 01 — cover
    d.new_page("Cover")
    c = d.c
    c.drawImage(logo, 64, H - 260, 110, 110, mask="auto")
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 64)
    c.drawString(64, H - 350, "Credo")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(64, H - 395, "Proof-triggered RWA settlement for Creditcoin.")
    y = d.para(
        64, H - 445,
        "Official USDC stays final on Ethereum. The ERC-1155 stays on Creditcoin. "
        "Only a cryptographic proof crosses chains — and the contract, not the backend, decides.",
        900, size=15,
    )
    x = 64
    for t in ("Attestcoin Protocol · USC v2", "Creditcoin CC3 Testnet", "Ethereum Sepolia"):
        x = d.chip(x, y - 40, t)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 11)
    c.drawString(64, 64, "BUIDL CTC 2026 Fall — RWA Track")

    # 02 — problem
    d.new_page("Problem")
    d.heading("The problem", "Cross-chain RWA settlement is broken in four ways.")
    d.bullets(64, H - 220, [
        ("Bridged money is not the seller's money.",
         "Wrapped USDC introduces custody, depeg and bridge-risk into a payment that was already final."),
        ("Oracles assert; they don't prove.",
         "A backend saying \"payment happened\" is a promise. Settlement deserves cryptographic evidence."),
        ("Operators hold god-mode.",
         "Most pipelines can redirect or fake settlement — a compromise away from losing every asset."),
        ("Payments are loosely coupled to delivery.",
         "Without binding buyer, token, amount and time-window on-chain, one transfer can settle the wrong deal."),
    ], 1150, size=13.5, gap=18)

    # 03 — solution
    d.new_page("Solution")
    d.heading("The solution", "Delivery-versus-payment, proven on-chain.")
    c = d.c
    cols = [
        ("PAYMENT STAYS PUT", "The buyer signs one plain USDC transfer on Sepolia. No bridge message, no wrapper, no second network for the user."),
        ("PROOF CROSSES", "Attestcoin turns the Sepolia receipt into a Merkle inclusion + continuity proof. That evidence is the only thing that crosses."),
        ("CONTRACT DECIDES", "SettleRWA releases escrow only when the verifier precompile accepts the proof and every bound field matches — synchronously, in one transaction."),
    ]
    x = 64
    for tag, body in cols:
        d.panel(x, H - 430, 368, 250)
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 24, H - 210, tag)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 12)
        lines = simpleSplit(body, "Helvetica", 12, 320)
        yy = H - 244
        for ln in lines:
            c.drawString(x + 24, yy, ln)
            yy -= 17
        x += 392
    d.para(64, H - 480,
           "The result feels like a normal payment for the buyer — and settles like a derivative contract for the protocol.",
           1150, size=13, color=TEXT)

    # 04 — flow
    flow_slide(d)

    # 05 — attestcoin depth
    attestation_slide(d)

    # 06 — security
    security_slide(d)

    # 07 — live proof
    metrics_slide(d)

    # 08 — developer experience
    d.new_page("Developer experience")
    d.heading("Builder-ready", "Integrate the layer. Keep your product.")
    d.bullets(64, H - 220, [
        ("In-app documentation.", "Quickstart, API reference, parameter spec, ABI downloads and security model served at /infra."),
        ("Compiler-generated ABIs.", "SettleRWA · PaymentVerifierUSC · TestRWA — byte-identical to the deployed artifacts, downloadable."),
        ("Six-step quickstart.", "Authenticate → approve → prepare → createSale → index → register payment. Everything after payment is automatic."),
        ("Strict API contract.", "Zod-validated JSON, SIWE-style wallet auth, HttpOnly sessions, typed error codes with request IDs."),
        ("25 automated tests + 7 Foundry tests", "including a 256-run fuzz suite on the settlement invariants."),
    ], 1150, size=13, gap=14)

    # 09 — positioning
    positioning_slide(d)

    # 10 — roadmap
    roadmap_slide(d)

    # 11 — limitations
    d.new_page("Honest limitations")
    d.heading("What this is not", "Stated plainly, because trust is the product.")
    d.bullets(64, H - 220, [
        ("Not an atomic two-chain swap.",
         "Payment is irreversible before release completes; the 24 h reclaim grace covers the proof period."),
        ("Not production value.",
         "Testnet-only deployment; Blockscout source verification is pending; curated asset onboarding."),
        ("No open marketplace yet.",
         "By design (ADR-009): private sales eliminate the double-buyer race until reservations exist."),
        ("Not permissionless onboarding.",
         "Asset allowlisting is operator-managed today; governance path is roadmap work."),
    ], 1150, size=13.5, gap=16)

    # 12 — closing
    closing_slide(d)

    d.save()
    os.remove(logo)
    print("wrote", OUT, os.path.getsize(OUT), "bytes,", d.page, "pages")


if __name__ == "__main__":
    main()
