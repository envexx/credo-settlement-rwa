import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import { MobileNav } from "@/components/mobile-nav";
import { siteMenus } from "@/components/site-navigation";

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
        <nav
          className="hidden items-center gap-1 rounded-full border bg-card/70 p-1 text-xs md:flex"
          aria-label="Primary"
        >
          {siteMenus.map((menu) => (
            <div key={menu.label} className="nav-menu group relative">
              <button className="flex items-center gap-1 rounded-full px-4 py-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60">
                {menu.label}
                <ChevronDown className="size-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>
              <div className="nav-menu-panel absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3">
                <div className="rounded-lg border bg-popover p-2 shadow-2xl">
                  {menu.items.map(([label, desc, href, Icon]) => (
                    <Link
                      key={String(label)}
                      href={String(href)}
                      className="flex gap-3 rounded-md p-3 hover:bg-muted"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span>
                        <strong className="block text-xs font-medium text-foreground">
                          {String(label)}
                        </strong>
                        <small className="mt-1 block text-[10px] leading-4 text-muted-foreground">
                          {String(desc)}
                        </small>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link
            className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            href="/infra"
          >
            Documentation
          </Link>
        </nav>
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
