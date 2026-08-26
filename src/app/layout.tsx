import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: {
    default: "Credo — Proof-triggered RWA settlement",
    template: "%s · Credo",
  },
  description:
    "Settle RWA ownership on Creditcoin against verified USDC payment on Ethereum—without bridging the payment.",
  icons: {
    icon: [{ url: "/brands/LOGO.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
