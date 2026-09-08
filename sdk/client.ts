/**
 * Credo settlement client — the same REST contract documented in
 * docs/integration/README.md, wrapped for integrators.
 *
 * Zero dependencies. Works in Node 18+ and browsers.
 */

export type CredoClientOptions = {
  /** API origin, e.g. https://credo.becoder.xyz */
  baseUrl?: string;
  fetch?: typeof fetch;
};

export type SettlementSnapshot = {
  saleId: string;
  saleStatus: "OPEN" | "SETTLED" | "RECLAIMED";
  payment: {
    status: string;
    sourceTxHash: string;
    sourceBlock?: string | null;
  } | null;
  proof: { status: string; queryId?: string } | null;
  settlement: {
    creditcoinTxHash: string;
    assetRecipient: string;
    tokenId: string;
  } | null;
};

export class CredoApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class CredoClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private bearer?: string;

  constructor(options: CredoClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? fetch;
  }

  /** SIWE-style login used by the browser app; sellers/buyers need it. */
  async login(wallet: {
    address: string;
    signMessage: (message: string) => Promise<string>;
  }): Promise<void> {
    const nonce = await this.json(
      await this.request("/api/v1/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ wallet: wallet.address }),
      }),
    );
    const statement = `Sign in to Credo for ${nonce.nonce}`;
    const signature = await wallet.signMessage(statement);
    const verified = await this.json(
      await this.request("/api/v1/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          wallet: wallet.address,
          signature,
          nonce: nonce.nonce,
          statement,
        }),
      }),
    );
    this.bearer = verified.token;
  }

  /** Reserve a playground sale for the authenticated buyer. */
  async reserveLiveSale(): Promise<{
    saleId: string;
    amountRaw: string;
    recipient: string;
  }> {
    return this.json(
      await this.request("/api/v1/playground/live-sale", { method: "POST" }),
    );
  }

  /** Exact USDC transfer instruction for an OPEN sale (buyer session only). */
  async paymentInstruction(saleId: string): Promise<{
    token: string;
    recipient: string;
    amountRaw: string;
    chainId: number;
  }> {
    return this.json(
      await this.request(`/api/v1/sales/${saleId}/payment-instruction`, {
        method: "POST",
      }),
    );
  }

  /** Register the buyer's Sepolia USDC transaction hash (once). */
  async registerPayment(
    saleId: string,
    sourceTxHash: string,
  ): Promise<{
    paymentId: string;
    status: string;
  }> {
    return this.json(
      await this.request(`/api/v1/sales/${saleId}/payment`, {
        method: "POST",
        body: JSON.stringify({ sourceTxHash }),
      }),
    );
  }

  /** Durable settlement snapshot; poll until saleStatus !== "OPEN". */
  async settlement(saleId: string): Promise<SettlementSnapshot> {
    return this.json(await this.request(`/api/v1/sales/${saleId}/settlement`));
  }

  /** Resolve once the sale is no longer OPEN; default timeout 15 minutes. */
  async waitForSettlement(
    saleId: string,
    {
      intervalMs = 15_000,
      timeoutMs = 15 * 60_000,
      onPoll,
    }: {
      intervalMs?: number;
      timeoutMs?: number;
      onPoll?: (snapshot: SettlementSnapshot) => void;
    } = {},
  ): Promise<SettlementSnapshot> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const snapshot = await this.settlement(saleId);
      onPoll?.(snapshot);
      if (snapshot.saleStatus !== "OPEN") return snapshot;
      if (Date.now() + intervalMs > deadline) return snapshot;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  private async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (this.bearer) headers.set("authorization", `Bearer ${this.bearer}`);
    headers.set("origin", this.baseUrl || "http://localhost:3000");
    return this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
  }

  private async json(response: Response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = (body as { error?: { code?: string; message?: string } })
        .error;
      throw new CredoApiError(
        response.status,
        error?.code ?? "UNKNOWN",
        error?.message ?? `Request failed with ${response.status}`,
      );
    }
    return body;
  }
}
