import { NextResponse } from "next/server";

import { setJwtAuthCookie } from "@/lib/auth-cookie";
import { firstGraphQLErrorMessage, wpLogin } from "@/lib/auth-wp";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const username = typeof record.username === "string" ? record.username : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!username.trim() || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  try {
    const { result, token, user } = await wpLogin(username, password);
    if (!token) {
      const msg =
        firstGraphQLErrorMessage(result.errors) ??
        "Sign in failed. Check your credentials.";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, user });
    setJwtAuthCookie(res, token);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign in failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
