import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopNav } from "@/components/desktop-nav";

const logo = "/brands/LOGO.png";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b bg-background/88 backdrop-blur-xl">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="container-shell flex h-18 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-[-.03em]"
        >
          <span className="grid size-8 place-items-center overflow-hidden rounded-md border">
            <NextImage
              src={logo}
              alt="Credo logo"
              width={32}
              height={32}
              className="size-full object-cover"
              priority
            />
          </span>
          CREDO<span className="text-primary">.</span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <MobileNav />
          <Button
            asChild
            size="sm"
            className="hidden h-8 bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
          >
            <Link href="/playground">
              Open Playground <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-shell site-footer-grid">
        <div>
          <Link href="/" className="site-footer-brand">
            <span className="overflow-hidden rounded-md">
              <NextImage
                src={logo}
                alt="Credo logo"
                width={30}
                height={30}
                className="size-full object-cover"
              />
            </span>
            CREDO.
          </Link>
          <p>
            Proof-triggered delivery-versus-payment settlement for real-world
            assets. Payment stays final on Ethereum, ownership settles on
            Creditcoin — only the proof crosses.
          </p>
        </div>
        <div>
          <strong>Product</strong>
          <Link href="/#mechanism">Mechanism</Link>
          <Link href="/#evidence">Evidence</Link>
          <Link href="/playground">Playground</Link>
        </div>
        <div>
          <strong>Developers</strong>
          <Link href="/infra#quickstart">Quickstart</Link>
          <Link href="/infra#api">API reference</Link>
          <Link href="/infra#abi">Contract ABI</Link>
        </div>
        <div>
          <strong>On-chain</strong>
          <a
            href="https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96"
            target="_blank"
            rel="noreferrer"
          >
            Live settlement ↗
          </a>
          <a
            href="https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010"
            target="_blank"
            rel="noreferrer"
          >
            Payment proof ↗
          </a>
          <a
            href="https://github.com/envexx/credo-settlement-rwa"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
        <div>
          <strong>Trust</strong>
          <Link href="/trust">Trust center</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/status">System status</Link>
        </div>
      </div>
      <div className="container-shell site-footer-bottom">
        <p>© 2026 Credo · CC3 Testnet · BUIDL CTC 2026 Fall</p>
        <p className="font-mono">
          NO BRIDGE · NO WRAPPED USDC · NO TRUSTED WORKER
        </p>
      </div>
    </footer>
  );
}
