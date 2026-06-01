import "server-only";

import { tryDeleteJwtAuthCookieServer } from "./auth-cookie";
import { getCartQuery, type CartQueryShape } from "./cart";
import { trySetWooSessionCookieServer } from "./cart-cookie";
import { uniqueGraphQLErrorMessages } from "./jwt-auth-errors";

export type CartPageData = {
  cart: CartQueryShape | null;
  gqlErrors: string[];
  /** WP returned a new session header that could not be stored during RSC — client should sync via /api/cart. */
  sessionSyncNeeded: boolean;
};

function friendlyCartLoadError(error: unknown): string {
  const msg = error instanceof Error ? error.message.trim() : "";
  if (!msg || msg.includes("WORDPRESS_API_URL is not configured")) {
    return "Store checkout is temporarily unavailable. Please try again shortly.";
  }
  if (/fetch failed|ECONNREFUSED|ETIMEDOUT|network/i.test(msg)) {
    return "Could not reach the store. Please try again in a moment.";
  }
  return `Could not load cart: ${msg}`;
}

export async function loadCartPageData(
  session: string | null,
  jwt: string | null
): Promise<CartPageData> {
  let gqlErrors: string[] = [];
  let cart: CartQueryShape | null = null;
  let sessionSyncNeeded = false;

  try {
    const result = await getCartQuery(session, jwt);

    if (result.sessionHeader?.trim()) {
      const persisted = await trySetWooSessionCookieServer(result.sessionHeader);
      if (!persisted) sessionSyncNeeded = true;
    }

    if (result.jwtWasInvalid) {
      await tryDeleteJwtAuthCookieServer();
    }

    if (result.errors?.length) {
      gqlErrors = uniqueGraphQLErrorMessages(result.errors);
    }
    cart = result.data?.cart ?? null;
  } catch (error) {
    gqlErrors = [friendlyCartLoadError(error)];
  }

  return { cart, gqlErrors, sessionSyncNeeded };
}
