/** WPGraphQL JWT often surfaces as generic "Internal server error" on viewer/customer/cart. */
export function graphQLErrorsLookLikeInvalidJwt(
  errors?: Array<{ message?: string }> | null
): boolean {
  if (!errors?.length) return false;
  return errors.some((e) => {
    const m = (e?.message ?? "").trim().toLowerCase();
    if (!m) return false;
    return (
      m === "internal server error" ||
      /expired|invalid jwt|invalid token|not authenticated|forbidden|bad auth|signature|jwt auth|unauthorized|wrong number of segments/.test(
        m
      )
    );
  });
}

export function friendlyInvalidJwtMessage(): string {
  return "Your sign-in session has expired or is no longer valid.";
}

/** Dedupe repeated GraphQL error strings for UI display. */
export function uniqueGraphQLErrorMessages(
  errors?: Array<{ message?: string }> | null
): string[] {
  if (!errors?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of errors) {
    const msg = typeof e?.message === "string" ? e.message.trim() : "";
    if (!msg || seen.has(msg)) continue;
    seen.add(msg);
    out.push(msg);
  }
  return out;
}
