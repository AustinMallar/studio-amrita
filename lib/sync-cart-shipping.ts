import "server-only";

import {
  getCartQuery,
  updateShippingMethodMutation,
  type CartQueryShape,
} from "./cart";
import { cheapestShippingMethodChoice } from "./cart-shipping-utils";

async function applyOptimalShippingIfNeeded(
  cart: CartQueryShape | null,
  session: string | null,
  jwt: string | null
): Promise<{ updated: boolean; sessionHeader?: string | null; jwtWasInvalid?: boolean }> {
  if (!cart || cart.needsShippingAddress === false) {
    return { updated: false };
  }

  const lines = cart.contents?.nodes?.filter(Boolean) ?? [];
  if (lines.length === 0) return { updated: false };

  const choice = cheapestShippingMethodChoice(
    cart.availableShippingMethods,
    cart.chosenShippingMethods
  );
  if (!choice) return { updated: false };

  const result = await updateShippingMethodMutation(session, choice, jwt);
  if (result.errors?.length) return { updated: false };

  return {
    updated: true,
    sessionHeader: result.sessionHeader ?? session,
    jwtWasInvalid: result.jwtWasInvalid,
  };
}

/** Load cart and ensure the cheapest available shipping rate is selected per package. */
export async function getCartWithOptimalShipping(
  session: string | null,
  jwt: string | null
) {
  let result = await getCartQuery(session, jwt);
  let sessionToken = result.sessionHeader?.trim() || session?.trim() || null;
  let jwtToken = result.jwtWasInvalid ? null : jwt;
  let jwtWasInvalid = Boolean(result.jwtWasInvalid);

  const sync = await applyOptimalShippingIfNeeded(
    result.data?.cart ?? null,
    sessionToken,
    jwtToken
  );

  if (sync.jwtWasInvalid) {
    jwtWasInvalid = true;
    jwtToken = null;
  }

  if (sync.updated) {
    sessionToken = sync.sessionHeader?.trim() || sessionToken;
    const refreshed = await getCartQuery(sessionToken, jwtToken);
    jwtWasInvalid = jwtWasInvalid || Boolean(refreshed.jwtWasInvalid);
    return {
      ...refreshed,
      sessionHeader: refreshed.sessionHeader ?? sessionToken,
      jwtWasInvalid,
    };
  }

  return { ...result, jwtWasInvalid };
}
