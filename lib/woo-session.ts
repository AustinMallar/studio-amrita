/**
 * WooGraphQL / WPGraphQL WooCommerce session handler expects:
 *   Header: `woocommerce-session: Session <jwt>`
 * Responses often return the full value (with `Session `) — send back unchanged.
 * If only the raw JWT is stored, prepend `Session ` when sending.
 */
export function normalizeOutgoingWooSessionHeader(
  token: string | null | undefined
): string | undefined {
  if (token == null) return undefined;
  const t = String(token).trim();
  if (!t) return undefined;
  if (/^session\s+/i.test(t)) return t;
  return `Session ${t}`;
}

export function graphQLErrorText(errors: Array<{ message?: string }> | undefined): string {
  return (errors ?? []).map((e) => e.message ?? "").join(" ");
}

export function isInvalidCartTokenError(errors: Array<{ message?: string }> | undefined): boolean {
  const text = graphQLErrorText(errors).toLowerCase();
  return (
    text.includes("invalid_cart_token") ||
    text.includes("invalid cart-token") ||
    text.includes("invalid cart token")
  );
}
