import { getCartQuery, removeItemsFromCartMutation } from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { graphQLErrorText, isInvalidCartTokenError } from "@/lib/woo-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { key?: string; keys?: string[] | string };

    const keys: string[] = (() => {
      if (Array.isArray(body.keys) && body.keys.length > 0) {
        return body.keys.map((k) => String(k).trim()).filter(Boolean);
      }
      if (body.keys != null && !Array.isArray(body.keys)) {
        const s = String(body.keys).trim();
        if (s) return [s];
      }
      if (body.key != null && String(body.key).trim()) {
        return [String(body.key).trim()];
      }
      return [];
    })();

    if (keys.length === 0) {
      return NextResponse.json({ error: "Missing cart item key" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value?.trim() || null;

    if (!session) {
      const warm = await getCartQuery(null);
      session = warm.sessionHeader ?? null;
    }

    let result = await removeItemsFromCartMutation(session, keys);

    if (isInvalidCartTokenError(result.errors)) {
      const warm = await getCartQuery(null);
      session = warm.sessionHeader ?? null;
      result = await removeItemsFromCartMutation(session, keys);
    }

    if (result.errors?.length) {
      const msg = graphQLErrorText(result.errors) || "Could not update cart";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const nodes = result.data?.removeItemsFromCart?.cart?.contents?.nodes?.filter(Boolean) ?? [];
    const itemCount = nodes.reduce((acc, line) => acc + (line?.quantity ?? 0), 0);

    const { sessionHeader, ...payload } = result;
    const res = NextResponse.json({ ...payload, itemCount });
    setWooSessionCookie(res, sessionHeader);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Remove from cart failed", itemCount: 0 },
      { status: 500 }
    );
  }
}
