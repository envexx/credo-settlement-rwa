import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  advanceSale,
  demoProof,
  demoSale,
  type Sale,
  settle,
  SettlementError,
} from "@/lib/settlement";

export const dynamic = "force-dynamic";

const sessionCookie = "credo_demo_session";
type DemoSession = { sale: Sale; queries: Set<string> };
const state = globalThis as typeof globalThis & {
  credoDemoSessions?: Map<string, DemoSession>;
};
const sessions = (state.credoDemoSessions ??= new Map<string, DemoSession>());

async function currentSession() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(sessionCookie)?.value;
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    sessionId = randomUUID();
    cookieStore.set(sessionCookie, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
  }
  let session = sessions.get(sessionId);
  if (!session) {
    if (sessions.size >= 100) sessions.delete(sessions.keys().next().value!);
    session = { sale: demoSale(), queries: new Set<string>() };
    sessions.set(sessionId, session);
  }
  return session;
}

const jsonSale = (sale: Sale) => ({
  ...sale,
  paymentAmount: sale.paymentAmount.toString(),
  assetId: sale.assetId.toString(),
});

export async function GET() {
  const session = await currentSession();
  return NextResponse.json(jsonSale(session.sale));
}

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    const body = (await request.json()) as { action?: string };
    if (body.action === "RESET") {
      session.sale = demoSale();
      session.queries = new Set();
    } else if (
      body.action === "CREATE" ||
      body.action === "PAY" ||
      body.action === "ATTEST" ||
      body.action === "PROVE"
    ) {
      session.sale = advanceSale(session.sale, body.action);
    } else if (body.action === "SETTLE") {
      session.sale = settle(
        session.sale,
        demoProof(session.sale),
        session.queries,
      );
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json(jsonSale(session.sale));
  } catch (error) {
    const message =
      error instanceof SettlementError ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
