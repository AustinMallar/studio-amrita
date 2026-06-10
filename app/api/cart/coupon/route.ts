import {
  applyCouponMutation,
  getCartQuery,
  removeCouponsMutation,
  type CartQueryShape,
} from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import { clearJwtAuthCookie } from "@/lib/auth-cookie";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { graphQLErrorText, isInvalidCartTokenError } from "@/lib/woo-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type CouponMutationResult = {
  data?: {
    applyCoupon?: { cart?: CartQueryShape | null };
    removeCoupons?: { cart?: CartQueryShape | null };
  };
  errors?: Array<{ message?: string }>;
  sessionHeader?: string | null;
  jwtWasInvalid?: boolean;
};

function cartFromResult(result: CouponMutationResult, action: "apply" | "remove") {
  if (action === "apply") {
    return result.data?.applyCoupon?.cart;
  }
  return result.data?.removeCoupons?.cart;
}

async function runCouponMutation(
  action: "apply" | "remove",
  codeOrCodes: string | string[]
): Promise<CouponMutationResult> {
  const cookieStore = await cookies();
  let session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value?.trim() || null;
  let jwt = await getJwtAuthToken();
  let jwtWasInvalid = false;

  if (!session) {
    const warm = await getCartQuery(null, jwt);
    jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
    if (warm.jwtWasInvalid) jwt = null;
    session = warm.sessionHeader ?? null;
  }

  const mutate = (activeSession: string | null) =>
    action === "apply"
      ? applyCouponMutation(activeSession, String(codeOrCodes), jwt)
      : removeCouponsMutation(
          activeSession,
          Array.isArray(codeOrCodes) ? codeOrCodes : [String(codeOrCodes)],
          jwt
        );

  let result = await mutate(session);
  jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;

  if (isInvalidCartTokenError(result.errors)) {
    const warm = await getCartQuery(null, jwtWasInvalid ? null : jwt);
    jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
    if (warm.jwtWasInvalid) jwt = null;
    session = warm.sessionHeader ?? null;
    result = await mutate(session);
    jwtWasInvalid = jwtWasInvalid || result.jwtWasInvalid;
  }

  return { ...result, jwtWasInvalid };
}

function jsonCartResponse(result: CouponMutationResult, action: "apply" | "remove") {
  const cart = cartFromResult(result, action);
  const nodes = cart?.contents?.nodes?.filter(Boolean) ?? [];
  const itemCount = nodes.reduce((acc, line) => acc + (line?.quantity ?? 0), 0);

  const { sessionHeader, jwtWasInvalid, ...payload } = result;
  const res = NextResponse.json({ ...payload, itemCount });
  if (jwtWasInvalid) clearJwtAuthCookie(res);
  setWooSessionCookie(res, sessionHeader);
  return res;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = body.code?.trim() ?? "";

    if (!code) {
      return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });
    }

    const result = await runCouponMutation("apply", code);

    if (result.errors?.length) {
      const msg = graphQLErrorText(result.errors) || "Could not apply coupon";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return jsonCartResponse(result, "apply");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Coupon apply failed", itemCount: 0 },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { code?: string; codes?: string[] };
    const codes = (() => {
      if (Array.isArray(body.codes) && body.codes.length > 0) {
        return body.codes.map((c) => String(c).trim()).filter(Boolean);
      }
      if (body.code?.trim()) {
        return [body.code.trim()];
      }
      return [];
    })();

    if (codes.length === 0) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
    }

    const result = await runCouponMutation("remove", codes);

    if (result.errors?.length) {
      const msg = graphQLErrorText(result.errors) || "Could not remove coupon";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return jsonCartResponse(result, "remove");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Coupon remove failed", itemCount: 0 },
      { status: 500 }
    );
  }
}
