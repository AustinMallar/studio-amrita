import { getCartQuery } from "@/lib/cart";
import { setWooSessionCookie } from "@/lib/cart-cookie";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value ?? null;
    const jwt = await getJwtAuthToken();

    const result = await getCartQuery(session, jwt);
    const nodes = result.data?.cart?.contents?.nodes?.filter(Boolean) ?? [];
    const itemCount = nodes.reduce((acc, line) => acc + (line?.quantity ?? 0), 0);

    const { sessionHeader, ...payload } = result;
    const res = NextResponse.json({ ...payload, itemCount });
    setWooSessionCookie(res, sessionHeader);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cart unavailable", itemCount: 0 },
      { status: 500 }
    );
  }
}
