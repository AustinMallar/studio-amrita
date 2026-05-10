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
  const firstName =
    typeof record.firstName === "string" ? record.firstName.trim() : "";
  const lastName = typeof record.lastName === "string" ? record.lastName.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const result = await updateCustomerMutation(token, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email,
    });

    const err = firstGraphQLErrorMessage(result.errors);
    if (err || !result.data?.updateCustomer?.customer) {
      return NextResponse.json(
        { error: err ?? "Could not update your profile." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
