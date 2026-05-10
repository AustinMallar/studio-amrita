import { NextResponse } from "next/server";

import { updateCustomerMutation } from "@/lib/account-mutations";
import { firstGraphQLErrorMessage } from "@/lib/auth-wp";
import type { CustomerAddress } from "@/lib/account-data";
import { getBearerFromCookies } from "@/lib/account-route-auth";

function pickAddress(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fields = [
    "firstName",
    "lastName",
    "company",
    "address1",
    "address2",
    "city",
    "state",
    "postcode",
    "country",
    "email",
    "phone",
  ] as const;

  const out: Record<string, string> = {};
  for (const key of fields) {
    const v = o[key];
    if (typeof v === "string" && v.trim().length > 0) {
      out[key] = v.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

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
  const billingRaw = pickAddress(record.billing);
  const shippingRaw = pickAddress(record.shipping);
  const shippingSameAsBilling =
    typeof record.shippingSameAsBilling === "boolean"
      ? record.shippingSameAsBilling
      : false;

  const billing = billingRaw as CustomerAddress | undefined;
  const shipping = shippingRaw as CustomerAddress | undefined;

  if (!billing && !shipping && !shippingSameAsBilling) {
    return NextResponse.json(
      { error: "Add billing or shipping details, or choose “same as billing”." },
      { status: 400 }
    );
  }

  /** WooCommerce shipping meta typically excludes email; omit if present. */
  let shippingInput = shipping;
  if (shippingInput && "email" in shippingInput) {
    const rest = { ...(shippingInput as Record<string, unknown>) };
    delete rest.email;
    shippingInput = rest as CustomerAddress;
  }

  try {
    const result = await updateCustomerMutation(token, {
      ...(billing ? { billing } : {}),
      ...(shippingInput ? { shipping: shippingInput } : {}),
      ...(shippingSameAsBilling ? { shippingSameAsBilling: true } : {}),
    });

    const err = firstGraphQLErrorMessage(result.errors);
    if (err || !result.data?.updateCustomer?.customer) {
      return NextResponse.json(
        { error: err ?? "Could not save addresses." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
