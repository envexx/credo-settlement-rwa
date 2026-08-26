export const SEPOLIA_CHAIN_KEY = 1;
export const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export type SaleStatus =
  | "DRAFT"
  | "OPEN"
  | "PAYMENT_CONFIRMED"
  | "WAITING_ATTESTATION"
  | "PROOF_READY"
  | "SETTLED";

export type Sale = {
  id: string;
  buyer: string;
  seller: string;
  paymentToken: string;
  paymentAmount: bigint;
  sourceChainKey: number;
  sourceBlockStart: number;
  sourceBlockEnd: number;
  assetId: bigint;
  status: SaleStatus;
  sourceTxHash?: string;
  sourceBlock?: number;
  queryId?: string;
  creditcoinTxHash?: string;
};

export type PaymentProof = {
  queryId: string;
  txHash: string;
  receiptSucceeded: boolean;
  chainKey: number;
  token: string;
  from: string;
  to: string;
  amount: bigint;
  sourceBlock: number;
};

export class SettlementError extends Error {}

const sameAddress = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

export function verifyPayment(
  sale: Sale,
  proof: PaymentProof,
  consumedQueries: ReadonlySet<string>,
): void {
  if (sale.status !== "PROOF_READY")
    throw new SettlementError("Sale is not ready to settle");
  if (consumedQueries.has(proof.queryId))
    throw new SettlementError("Proof was already consumed");
  if (!proof.receiptSucceeded)
    throw new SettlementError("Source transaction failed");
  if (proof.chainKey !== sale.sourceChainKey)
    throw new SettlementError("Wrong source chain");
  if (!sameAddress(proof.token, sale.paymentToken))
    throw new SettlementError("Wrong payment token");
  if (!sameAddress(proof.from, sale.buyer))
    throw new SettlementError("Wrong payer");
  if (!sameAddress(proof.to, sale.seller))
    throw new SettlementError("Wrong recipient");
  if (proof.amount !== sale.paymentAmount)
    throw new SettlementError("Wrong payment amount");
  if (
    proof.sourceBlock < sale.sourceBlockStart ||
    proof.sourceBlock > sale.sourceBlockEnd
  ) {
    throw new SettlementError("Payment is outside the source block window");
  }
}

export function advanceSale(
  sale: Sale,
  action: "CREATE" | "PAY" | "ATTEST" | "PROVE",
): Sale {
  const transitions: Record<typeof action, [SaleStatus, SaleStatus]> = {
    CREATE: ["DRAFT", "OPEN"],
    PAY: ["OPEN", "PAYMENT_CONFIRMED"],
    ATTEST: ["PAYMENT_CONFIRMED", "WAITING_ATTESTATION"],
    PROVE: ["WAITING_ATTESTATION", "PROOF_READY"],
  };
  const [expected, next] = transitions[action];
  if (sale.status !== expected)
    throw new SettlementError(
      `Cannot ${action.toLowerCase()} while sale is ${sale.status}`,
    );
  if (action === "PAY") {
    return {
      ...sale,
      status: next,
      sourceTxHash:
        "0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010",
      sourceBlock: 11_566_178,
    };
  }
  if (action === "PROVE") {
    return {
      ...sale,
      status: next,
      queryId:
        "0x4c94e8b11295001bc24b7f61686c02aca5b817a0ce4ac1917f50163ad853e655",
    };
  }
  return { ...sale, status: next };
}

export function settle(
  sale: Sale,
  proof: PaymentProof,
  consumedQueries: Set<string>,
): Sale {
  verifyPayment(sale, proof, consumedQueries);
  consumedQueries.add(proof.queryId);
  return {
    ...sale,
    status: "SETTLED",
    creditcoinTxHash:
      "0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96",
  };
}

export function demoSale(): Sale {
  return {
    id: "0x8d4c39b6bc44f36e8c2456c3c47f6d04c907475f37e05c16fd2655b9bb3b6c1d",
    buyer: "0x09549e3a38380a4ceB461D011542d0e43eC633eD",
    seller: "0x5bF729412bB61f8cF92f927665397aB7eFbF7802",
    paymentToken: SEPOLIA_USDC,
    paymentAmount: 5_000_000n,
    sourceChainKey: SEPOLIA_CHAIN_KEY,
    sourceBlockStart: 11_566_169,
    sourceBlockEnd: 11_573_369,
    assetId: 1001n,
    status: "DRAFT",
  };
}

export function demoProof(sale: Sale): PaymentProof {
  return {
    queryId:
      sale.queryId ??
      "0x4c94e8b11295001bc24b7f61686c02aca5b817a0ce4ac1917f50163ad853e655",
    txHash:
      sale.sourceTxHash ??
      "0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010",
    receiptSucceeded: true,
    chainKey: sale.sourceChainKey,
    token: sale.paymentToken,
    from: sale.buyer,
    to: sale.seller,
    amount: sale.paymentAmount,
    sourceBlock: sale.sourceBlock ?? sale.sourceBlockStart + 9,
  };
}
