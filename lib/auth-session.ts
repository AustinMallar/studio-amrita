import "server-only";

import { cookies } from "next/headers";

import { WP_JWT_AUTH_COOKIE } from "./auth-cookie";

export async function getJwtAuthToken(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(WP_JWT_AUTH_COOKIE)?.value;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
