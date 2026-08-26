import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  const requestId = `req_${randomUUID()}`;
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "INVALID_SCHEMA",
          message: error.issues[0]?.message ?? "Invalid request",
          requestId,
        },
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: { code: error.code, message: error.message, requestId } },
      { status: error.status },
    );
  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    }),
  );
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        requestId,
      },
    },
    { status: 500 },
  );
}
