import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "settlerwa-api",
    time: new Date().toISOString(),
  });
}
