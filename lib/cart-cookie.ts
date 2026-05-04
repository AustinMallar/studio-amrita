import type { NextResponse } from "next/server";
import { WOOCOMMERCE_SESSION_COOKIE } from "./session-cookie";

export function setWooSessionCookie(
  res: NextResponse,
  sessionHeader: string | null | undefined
) {
  if (!sessionHeader) return;
  res.cookies.set(WOOCOMMERCE_SESSION_COOKIE, sessionHeader, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}
