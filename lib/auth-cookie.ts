import type { NextResponse } from "next/server";

/** HttpOnly cookie storing the JWT from WPGraphQL JWT Authentication (`authToken` / `jwtAuthToken`). */
export const WP_JWT_AUTH_COOKIE = "wp-jwt-auth";

const isProduction = process.env.NODE_ENV === "production";

export function setJwtAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(WP_JWT_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearJwtAuthCookie(res: NextResponse) {
  res.cookies.set(WP_JWT_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  });
}
