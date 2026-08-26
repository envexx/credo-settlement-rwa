import { authenticate } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { verifyRequest } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { protectRequest } from "@/lib/security";
export async function POST(request: Request) {
  try {
    protectRequest(request, 10);
    const body = verifyRequest.parse(await request.json());
    await authenticate(
      body.walletAddress as `0x${string}`,
      body.message,
      body.signature as `0x${string}`,
    );
    return NextResponse.json({
      authenticated: true,
      walletAddress: body.walletAddress,
    });
  } catch (error) {
    return apiError(error);
  }
}
