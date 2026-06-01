import type { NextResponse } from "next/server";
import { isReadonlyCookiesError } from "./server-cookies";
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

/**
 * Persist refreshed WooCommerce session from route handlers (always works) or Server
 * Components (returns false when Next.js forbids mutation — caller should sync via /api/cart).
 */
export async function trySetWooSessionCookieServer(
  sessionHeader: string | null | undefined
): Promise<boolean> {
  if (!sessionHeader?.trim()) return true;
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    store.set(WOOCOMMERCE_SESSION_COOKIE, sessionHeader.trim(), WOO_SESSION_COOKIE_OPTIONS);
    return true;
  } catch (error) {
    if (isReadonlyCookiesError(error)) return false;
    throw error;
  }
}
