import { NextResponse } from "next/server";

import { firstGraphQLErrorMessage } from "@/lib/auth-wp";
import { wpSendPasswordResetEmail } from "@/lib/password-reset-wp";

const PUBLIC_MESSAGE =
  "If an account exists for that email or username, we sent password reset instructions.";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const username = typeof record.username === "string" ? record.username.trim() : "";

  if (!username) {
    return NextResponse.json({ error: "Username or email is required." }, { status: 400 });
  }

  try {
    const result = await wpSendPasswordResetEmail(username);
    const err = firstGraphQLErrorMessage(result.errors);
    if (err) {
      /** Same response whether user exists — avoids account enumeration. */
      console.warn("[forgot-password] GraphQL:", err);
    }
    return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
