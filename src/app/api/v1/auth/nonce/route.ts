import { issueChallenge } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { nonceRequest } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { protectRequest } from "@/lib/security";
export async function POST(request: Request) {
  try {
    protectRequest(request, 10);
    const { walletAddress } = nonceRequest.parse(await request.json());
    return NextResponse.json(await issueChallenge(walletAddress));
  } catch (error) {
    return apiError(error);
  }
}
