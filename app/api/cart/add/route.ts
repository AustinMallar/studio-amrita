import { addToCartMutation, getCartQuery } from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import { clearJwtAuthCookie } from "@/lib/auth-cookie";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { isInvalidCartTokenError } from "@/lib/woo-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: number | string;
      variationId?: number | string | null;
      quantity?: number | string;
    };

    const productId = Number(body.productId);
    const quantityRaw = Number(body.quantity);
    const quantity = Number.isFinite(quantityRaw)
      ? Math.max(1, Math.min(99, Math.floor(quantityRaw)))
      : 1;

    const vRaw = body.variationId;
    const variationId =
      vRaw != null && vRaw !== ""
        ? Number(vRaw)
        : null;

    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    if (variationId != null && (!Number.isFinite(variationId) || variationId <= 0)) {
      return NextResponse.json({ error: "Invalid variationId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value?.trim() || null;
    const jwt = await getJwtAuthToken();

    const cartInput = {
      productId,
      quantity,
      variationId: variationId != null && variationId > 0 ? variationId : null,
    };

    let jwtWasInvalid = false;

    /** Establish a WooCommerce session when missing (required by some hosts). */
    if (!session) {
      const warm = await getCartQuery(null, jwt);
      jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
      session = warm.sessionHeader ?? null;
    }

    let result = await addToCartMutation(session, cartInput, jwt);
    jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;

    /** Stale or malformed cookie / token — fetch a fresh session and retry once. */
    if (isInvalidCartTokenError(result.errors)) {
      const warm = await getCartQuery(null, jwtWasInvalid ? null : jwt);
      jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
      session = warm.sessionHeader ?? null;
      result = await addToCartMutation(session, cartInput, jwtWasInvalid ? null : jwt);
      jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;
    }

    const { sessionHeader, jwtWasInvalid: resultJwtInvalid, ...payload } = result;
    jwtWasInvalid = jwtWasInvalid || resultJwtInvalid;
    const res = NextResponse.json(payload);
    if (jwtWasInvalid) clearJwtAuthCookie(res);
    setWooSessionCookie(res, sessionHeader);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Add to cart failed" },
      { status: 500 }
    );
  }
}
