import { NextResponse } from "next/server";

import { clearJwtAuthCookie } from "@/lib/auth-cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearJwtAuthCookie(res);
  return res;
}
