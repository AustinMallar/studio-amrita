import { getCartQuery } from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import {
  checkoutMutation,
  DEFAULT_PAYPAL_GATEWAY_ID,
  type CheckoutMutationInput,
  type CustomerAddressInput,
} from "@/lib/checkout";
import { flattenShippingRates } from "@/lib/cart-shipping-utils";
import { firstGraphQLErrorMessage, wpFetchViewer } from "@/lib/auth-wp";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { isInvalidCartTokenError } from "@/lib/woo-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function gatewayId(): string {
  const env = process.env.WOOCOMMERCE_PAYMENT_GATEWAY_ID?.trim();
  return env && env.length > 0 ? env : DEFAULT_PAYPAL_GATEWAY_ID;
}

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

function toGraphQLAddress(
  addr: Record<string, string>,
  opts: { includeEmail: boolean; overwrite: boolean }
): CustomerAddressInput {
  const country = addr.country?.trim().toUpperCase();
  const input: CustomerAddressInput = {
    overwrite: opts.overwrite,
    ...(addr.firstName ? { firstName: addr.firstName } : {}),
    ...(addr.lastName ? { lastName: addr.lastName } : {}),
    ...(addr.company ? { company: addr.company } : {}),
    ...(addr.address1 ? { address1: addr.address1 } : {}),
    ...(addr.address2 ? { address2: addr.address2 } : {}),
    ...(addr.city ? { city: addr.city } : {}),
    ...(addr.state ? { state: addr.state } : {}),
    ...(addr.postcode ? { postcode: addr.postcode } : {}),
    ...(country ? { country } : {}),
    ...(opts.includeEmail && addr.email ? { email: addr.email } : {}),
    ...(addr.phone ? { phone: addr.phone } : {}),
  };
  return input;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const jwt = await getJwtAuthToken();

    const billingRaw = pickAddress(record.billing);
    let billingEmail = billingRaw?.email?.trim() ?? "";
    if (!billingEmail && jwt) {
      try {
        const vr = await wpFetchViewer(jwt);
        billingEmail = vr.data?.viewer?.email?.trim() ?? "";
      } catch {
        billingEmail = "";
      }
    }

    if (!billingRaw || !billingEmail) {
      return NextResponse.json(
        { error: "Billing address and email are required." },
        { status: 400 }
      );
    }

    const billingWithEmail: Record<string, string> = { ...billingRaw, email: billingEmail };
    if (!billingWithEmail.firstName || !billingWithEmail.lastName || !billingWithEmail.address1) {
      return NextResponse.json(
        { error: "Please enter your name and street address." },
        { status: 400 }
      );
    }
    if (!billingWithEmail.city || !billingWithEmail.postcode || !billingWithEmail.country) {
      return NextResponse.json(
        { error: "City, postal code, and country are required." },
        { status: 400 }
      );
    }

    const shipToDifferent =
      typeof record.shipToDifferentAddress === "boolean" ? record.shipToDifferentAddress : false;
    const shippingRaw = shipToDifferent ? pickAddress(record.shipping) : null;
    if (shipToDifferent) {
      if (
        !shippingRaw?.firstName ||
        !shippingRaw?.lastName ||
        !shippingRaw?.address1 ||
        !shippingRaw?.city ||
        !shippingRaw?.postcode ||
        !shippingRaw?.country
      ) {
        return NextResponse.json(
          { error: "Please complete the shipping address." },
          { status: 400 }
        );
      }
    }

    const customerNote =
      typeof record.customerNote === "string" ? record.customerNote.trim().slice(0, 2000) : "";

    const shippingMethodsBody = Array.isArray(record.shippingMethods)
      ? (record.shippingMethods as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

    const cookieStore = await cookies();
    let session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value?.trim() || null;

    function adoptSession(h: string | null | undefined) {
      if (h && h.trim().length > 0) session = h.trim();
    }

    if (!session) {
      const warm = await getCartQuery(null, jwt);
      adoptSession(warm.sessionHeader);
    }

    let cartResult = await getCartQuery(session, jwt);
    adoptSession(cartResult.sessionHeader);
    if (isInvalidCartTokenError(cartResult.errors)) {
      const warm = await getCartQuery(null, jwt);
      adoptSession(warm.sessionHeader);
      cartResult = await getCartQuery(session, jwt);
      adoptSession(cartResult.sessionHeader);
    }

    const cart = cartResult.data?.cart ?? null;
    const lines = (cart?.contents?.nodes ?? []).filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const flatRates = flattenShippingRates(cart?.availableShippingMethods);
    let chosen = [...(cart?.chosenShippingMethods ?? [])].filter(Boolean) as string[];

    if (shippingMethodsBody.length > 0) {
      chosen = shippingMethodsBody;
    }
    if (flatRates.length > 0 && chosen.length === 0 && flatRates.length === 1) {
      chosen = [flatRates[0].id];
    }
    if (flatRates.length > 0 && chosen.length === 0) {
      return NextResponse.json(
        {
          error:
            "No shipping method selected. Choose a shipping option on the cart or checkout page.",
        },
        { status: 400 }
      );
    }

    const billingInput = toGraphQLAddress(billingWithEmail, { includeEmail: true, overwrite: true });
    let shippingInput: CustomerAddressInput | undefined;
    if (shipToDifferent && shippingRaw) {
      shippingInput = toGraphQLAddress(shippingRaw, { includeEmail: false, overwrite: true });
    }

    const paymentMethod = gatewayId();

    const checkoutInput: CheckoutMutationInput = {
      paymentMethod,
      shippingMethod: chosen.length > 0 ? chosen : undefined,
      shipToDifferentAddress: shipToDifferent,
      billing: billingInput,
      shipping: shippingInput,
      customerNote: customerNote.length > 0 ? customerNote : undefined,
    };

    let checkoutResult = await checkoutMutation(session, checkoutInput, jwt);
    adoptSession(checkoutResult.sessionHeader);
    if (isInvalidCartTokenError(checkoutResult.errors)) {
      const warm = await getCartQuery(null, jwt);
      adoptSession(warm.sessionHeader);
      checkoutResult = await checkoutMutation(session, checkoutInput, jwt);
      adoptSession(checkoutResult.sessionHeader);
    }

    const gqlErr = firstGraphQLErrorMessage(checkoutResult.errors);
    if (gqlErr || !checkoutResult.data?.checkout) {
      return NextResponse.json(
        { error: gqlErr ?? "Checkout failed." },
        { status: 400 }
      );
    }

    const payload = checkoutResult.data.checkout;
    const res = NextResponse.json({
      ok: true,
      result: payload.result ?? null,
      redirect: payload.redirect ?? null,
      order: payload.order
        ? {
            databaseId: payload.order.databaseId ?? null,
            orderNumber: payload.order.orderNumber ?? null,
            orderKey: payload.order.orderKey ?? null,
          }
        : null,
    });
    setWooSessionCookie(res, checkoutResult.sessionHeader);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed." },
      { status: 500 }
    );
  }
}
