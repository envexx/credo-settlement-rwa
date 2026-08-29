export type SettlementTone = "waiting" | "processing" | "success" | "error";

export type SettlementPresentation = {
  tone: SettlementTone;
  title: string;
  body: string;
  nextAction: string;
  terminal: boolean;
};

export function settlementPresentation(input: {
  saleStatus?: string | undefined;
  proofStatus?: string | null | undefined;
}): SettlementPresentation {
  if (input.saleStatus === "SETTLED") {
    return {
      tone: "success",
      title: "Payment became ownership",
      body: "The verified payment released the RWA to the buyer on Creditcoin.",
      nextAction: "Inspect the public settlement evidence.",
      terminal: true,
    };
  }
  if (input.saleStatus === "RECLAIMED") {
    return {
      tone: "error",
      title: "Sale was reclaimed",
      body: "The payment window ended and the escrowed asset returned to the seller.",
      nextAction: "Start a new reservation before paying.",
      terminal: true,
    };
  }
  if (input.proofStatus === "PERMANENT_REJECTION") {
    return {
      tone: "error",
      title: "Payment proof was rejected",
      body: "The payment cannot satisfy this sale's bound terms.",
      nextAction: "Review the payment details before starting another sale.",
      terminal: true,
    };
  }
  if (input.proofStatus === "RETRYABLE_ERROR") {
    return {
      tone: "processing",
      title: "Proof submission will retry",
      body: "A temporary proof or network problem interrupted this attempt.",
      nextAction: "Keep the recovery link; no second payment is required.",
      terminal: false,
    };
  }
  if (input.proofStatus) {
    return {
      tone: "processing",
      title: "Payment detected — proof in progress",
      body: "Attestcoin is preparing evidence. This normally takes 8–10 minutes.",
      nextAction: "You may close this page and return with the recovery link.",
      terminal: false,
    };
  }
  return {
    tone: "waiting",
    title: "Ready for payment",
    body: "Pay the exact test USDC amount shown below from the connected buyer wallet.",
    nextAction: "Complete the Sepolia payment.",
    terminal: false,
  };
}
