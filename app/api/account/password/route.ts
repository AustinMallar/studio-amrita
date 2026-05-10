import { NextResponse } from "next/server";

import { updateCustomerMutation } from "@/lib/account-mutations";
import { firstGraphQLErrorMessage } from "@/lib/auth-wp";
import { getBearerFromCookies } from "@/lib/account-route-auth";

export async function POST(req: Request) {
  const token = await getBearerFromCookies();
  if (!token) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const password = typeof record.password === "string" ? record.password : "";

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const result = await updateCustomerMutation(token, { password });

    const err = firstGraphQLErrorMessage(result.errors);
    if (err || !result.data?.updateCustomer?.customer) {
      return NextResponse.json(
        { error: err ?? "Could not update password." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
