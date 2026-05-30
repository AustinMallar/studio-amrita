import { getCartQuery, updateShippingMethodMutation } from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import { clearJwtAuthCookie } from "@/lib/auth-cookie";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { graphQLErrorText, isInvalidCartTokenError } from "@/lib/woo-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      shippingMethods?: string[];
      rateId?: string;
    };

    const shippingMethods = (() => {
      if (Array.isArray(body.shippingMethods) && body.shippingMethods.length > 0) {
        return body.shippingMethods.map((s) => String(s).trim()).filter(Boolean);
      }
      if (body.rateId != null && String(body.rateId).trim()) {
        return [String(body.rateId).trim()];
      }
      return [];
    })();

    if (shippingMethods.length === 0) {
      return NextResponse.json({ error: "Missing shipping method id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value?.trim() || null;
    const jwt = await getJwtAuthToken();

    let jwtWasInvalid = false;

    if (!session) {
      const warm = await getCartQuery(null, jwt);
      jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
      session = warm.sessionHeader ?? null;
    }

    let result = await updateShippingMethodMutation(session, shippingMethods, jwt);
    jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;

    if (isInvalidCartTokenError(result.errors)) {
      const warm = await getCartQuery(null, jwtWasInvalid ? null : jwt);
      jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
      session = warm.sessionHeader ?? null;
      result = await updateShippingMethodMutation(session, shippingMethods, jwtWasInvalid ? null : jwt);
      jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;
    }

    if (result.errors?.length) {
      const msg = graphQLErrorText(result.errors) || "Could not update shipping";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const nodes =
      result.data?.updateShippingMethod?.cart?.contents?.nodes?.filter(Boolean) ?? [];
    const itemCount = nodes.reduce((acc, line) => acc + (line?.quantity ?? 0), 0);

    const { sessionHeader, jwtWasInvalid: resultJwtInvalid, ...payload } = result;
    jwtWasInvalid = jwtWasInvalid || resultJwtInvalid;
    const res = NextResponse.json({ ...payload, itemCount });
    if (jwtWasInvalid) clearJwtAuthCookie(res);
    setWooSessionCookie(res, sessionHeader);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Shipping update failed", itemCount: 0 },
      { status: 500 }
    );
  }
}
