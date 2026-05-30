import { NextResponse } from "next/server";

import { firstGraphQLErrorMessage } from "@/lib/auth-wp";
import { wpResetUserPassword } from "@/lib/password-reset-wp";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const key = typeof record.key === "string" ? record.key : "";
  const login = typeof record.login === "string" ? record.login : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!key.trim() || !login.trim()) {
    return NextResponse.json(
      { error: "Reset link is missing required fields. Request a new reset email." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const result = await wpResetUserPassword(key, login, password);
    const err = firstGraphQLErrorMessage(result.errors);
    if (err || !result.data?.resetUserPassword) {
      return NextResponse.json(
        {
          error:
            err ??
            "Could not reset password. The link may be invalid or expired. Request a new one.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reset failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
