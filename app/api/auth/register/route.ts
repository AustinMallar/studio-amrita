import { NextResponse } from "next/server";

import { setJwtAuthCookie } from "@/lib/auth-cookie";
import { firstGraphQLErrorMessage, wpRegister } from "@/lib/auth-wp";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const username = typeof record.username === "string" ? record.username : "";
  const email = typeof record.email === "string" ? record.email : "";
  const password = typeof record.password === "string" ? record.password : "";
  const firstName = typeof record.firstName === "string" ? record.firstName : undefined;
  const lastName = typeof record.lastName === "string" ? record.lastName : undefined;

  if (!username.trim() || !email.trim() || !password) {
    return NextResponse.json(
      { error: "Username, email, and password are required." },
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
    const out = await wpRegister({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    if (!out.token) {
      const msg =
        firstGraphQLErrorMessage(out.result.errors) ??
        "Could not create your account. Registration may be disabled in WordPress.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true, user: out.user, source: out.source });
    setJwtAuthCookie(res, out.token);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
