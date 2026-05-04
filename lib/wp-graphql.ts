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
  sessionToken?: string | null
): Promise<GraphQLResponse<T> & { sessionHeader: string | null }> {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) {
    throw new Error("WORDPRESS_API_URL is not configured");
  }

  const outgoing = normalizeOutgoingWooSessionHeader(sessionToken ?? undefined);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(outgoing ? { "woocommerce-session": outgoing } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const sessionHeader = res.headers.get("woocommerce-session");
  const json = (await res.json()) as GraphQLResponse<T>;

  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status}`);
  }

  return { ...json, sessionHeader };
}
