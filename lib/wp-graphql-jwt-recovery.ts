import "server-only";

import { graphQLErrorsLookLikeInvalidJwt } from "./jwt-auth-errors";
import { wpGraphQL } from "./wp-graphql";

type WpGraphQLResult<T> = Awaited<ReturnType<typeof wpGraphQL<T>>>;

/**
 * When a stale JWT breaks WooCommerce GraphQL (often "Internal server error"), retry once
 * without the Authorization header so the guest/session cart still works.
 */
export async function wpGraphQLWithJwtRecovery<T>(
  query: string,
  variables?: Record<string, unknown>,
  sessionToken?: string | null,
  authToken?: string | null
): Promise<WpGraphQLResult<T> & { jwtWasInvalid: boolean }> {
  const first = await wpGraphQL<T>(query, variables, sessionToken, authToken);

  const hasJwt = typeof authToken === "string" && authToken.trim().length > 0;
  if (hasJwt && graphQLErrorsLookLikeInvalidJwt(first.errors)) {
    const retry = await wpGraphQL<T>(query, variables, sessionToken, null);
    return { ...retry, jwtWasInvalid: true };
  }

  return { ...first, jwtWasInvalid: false };
}
