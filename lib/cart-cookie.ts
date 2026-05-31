import type { NextResponse } from "next/server";
import { WOOCOMMERCE_SESSION_COOKIE } from "./session-cookie";

const WOO_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export function setWooSessionCookie(
  res: NextResponse,
  sessionHeader: string | null | undefined
) {
  if (!sessionHeader) return;
  res.cookies.set(WOOCOMMERCE_SESSION_COOKIE, sessionHeader, WOO_SESSION_COOKIE_OPTIONS);
}

/** Persist refreshed WooCommerce session from Server Components / route handlers. */
export async function setWooSessionCookieServer(
  sessionHeader: string | null | undefined
) {
  if (!sessionHeader?.trim()) return;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(WOOCOMMERCE_SESSION_COOKIE, sessionHeader.trim(), WOO_SESSION_COOKIE_OPTIONS);
}
