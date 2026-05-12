import "server-only";

import { normalizeOutgoingWooSessionHeader } from "./woo-session";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

/**
 * Server-side GraphQL POST with optional WooCommerce session header.
 * Returns any new session token from the `woocommerce-session` response header.
 */
export async function wpGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  sessionToken?: string | null,
  /** WPGraphQL JWT — sent as `Authorization: Bearer …` for authenticated requests (e.g. `viewer`). */
  authToken?: string | null
): Promise<GraphQLResponse<T> & { sessionHeader: string | null }> {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) {
    throw new Error("WORDPRESS_API_URL is not configured");
  }

  const outgoing = normalizeOutgoingWooSessionHeader(sessionToken ?? undefined);
  const bearer =
    typeof authToken === "string" && authToken.trim().length > 0
      ? authToken.trim()
      : null;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(outgoing ? { "woocommerce-session": outgoing } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const sessionHeader = res.headers.get("woocommerce-session");

  const raw = await res.text();
  let json: GraphQLResponse<T> = {};
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as GraphQLResponse<T>;
    } catch {
      if (!res.ok) {
        throw new Error(`GraphQL HTTP ${res.status}: expected JSON`);
      }
      throw new Error("Invalid JSON from GraphQL endpoint");
    }
  }

  /**
   * Many WP hosts return HTTP 401/403 with a normal GraphQL `{ errors: [...] }` body (e.g. expired
   * JWT). Throwing here surfaced as “Could not reach WordPress” on /account. Prefer returning
   * those errors so callers can show the real message and treat `viewer` as null.
   */
  if (!res.ok) {
    if (json.errors?.length) {
      return { ...json, sessionHeader };
    }
    throw new Error(`GraphQL HTTP ${res.status}`);
  }

  return { ...json, sessionHeader };
}
