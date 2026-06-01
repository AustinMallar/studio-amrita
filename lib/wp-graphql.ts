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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(outgoing ? { "woocommerce-session": outgoing } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch (first) {
    /** Transient network blips between Vercel and WordPress. */
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(outgoing ? { "woocommerce-session": outgoing } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
      });
    } catch {
      throw first;
    }
  }

  if (!res.ok && [502, 503, 504].includes(res.status)) {
    const retry = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(outgoing ? { "woocommerce-session": outgoing } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (retry.ok || retry.status < 500) res = retry;
  }

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
   * JWT). Prefer returning those errors so callers can show the real message and treat `viewer` as null.
   *
   * JWT / REST-style plugins sometimes return `{ message: "...", code: "..." }` without `errors`.
   */
  if (!res.ok) {
    /**
     * Query Analyzer, security plugins, or reverse proxies sometimes respond with HTTP 403/401 even
     * when the body is valid GraphQL containing `data` (and optional `extensions`). Treat like a
     * normal response so authenticated viewer/customer queries still succeed.
     */
    if (json.data !== undefined) {
      return { ...json, sessionHeader };
    }

    if (json.errors?.length) {
      return { ...json, sessionHeader };
    }

    const loose = json as Record<string, unknown>;
    const restMsg =
      typeof loose.message === "string"
        ? loose.message
        : typeof loose.error === "string"
          ? loose.error
          : typeof loose.error_description === "string"
            ? loose.error_description
            : null;

    if (restMsg?.trim()) {
      return {
        errors: [{ message: restMsg.trim() }],
        data: undefined,
        sessionHeader,
      };
    }

    const snippet = raw.replace(/\s+/g, " ").trim();
    const preview =
      snippet.length > 200 ? `${snippet.slice(0, 200)}…` : snippet;
    throw new Error(
      preview
        ? `GraphQL HTTP ${res.status}: ${preview}`
        : `GraphQL HTTP ${res.status} (empty body)`
    );
  }

  return { ...json, sessionHeader };
}
