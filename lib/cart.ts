import "server-only";

import type { CartProductNode } from "./cart-product-image";
import { isInvalidCartTokenError } from "./woo-session";
import { wpGraphQLWithJwtRecovery } from "./wp-graphql-jwt-recovery";

const CART_PRODUCT_IMAGE_FIELDS = `
  __typename
  ... on SimpleProduct {
    name
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
  }
  ... on VariableProduct {
    name
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
  }
  ... on ProductVariation {
    name
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    image {
      sourceUrl
      altText
    }
  }
`;

/** Full cart selection returned by GetCart and cart-returning mutations (lines + totals + shipping). */
const CART_SELECTION_FIELDS = `
  contents {
    nodes {
      key
      quantity
      subtotal
      product {
        node {
          ${CART_PRODUCT_IMAGE_FIELDS}
        }
      }
    }
  }
  total
  subtotal
  shippingTotal
  needsShippingAddress
  chosenShippingMethods
  availableShippingMethods {
    rates {
      id
      label
      cost
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      cart {
        ${CART_SELECTION_FIELDS}
      }
    }
  }
`;

export const GET_CART_QUERY = `
  query GetCart($recalculateTotals: Boolean) {
    cart(recalculateTotals: $recalculateTotals) {
      ${CART_SELECTION_FIELDS}
    }
  }
`;

const CART_MUTATION_PAYLOAD = `
  cart {
    ${CART_SELECTION_FIELDS}
  }
`;

export const REMOVE_ITEMS_FROM_CART_MUTATION = `
  mutation RemoveItemsFromCart($input: RemoveItemsFromCartInput!) {
    removeItemsFromCart(input: $input) {
      ${CART_MUTATION_PAYLOAD}
    }
  }
`;

export const UPDATE_SHIPPING_METHOD_MUTATION = `
  mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) {
    updateShippingMethod(input: $input) {
      ${CART_MUTATION_PAYLOAD}
    }
  }
`;

/** WooCommerce GraphQL cart subset used by the storefront. */
export type CartShippingRate = {
  id?: string | null;
  label?: string | null;
  cost?: string | null;
};

export type CartShippingPackage = {
  rates?: CartShippingRate[] | null;
};

export type CartQueryShape = {
  contents?: {
    nodes?: Array<{
      key?: string;
      quantity?: number | null;
      subtotal?: string | null;
      product?: {
        node?: (CartProductNode & { __typename?: string }) | null;
      } | null;
    } | null> | null;
  } | null;
  total?: string | null;
  subtotal?: string | null;
  shippingTotal?: string | null;
  needsShippingAddress?: boolean | null;
  chosenShippingMethods?: string[] | null;
  availableShippingMethods?: CartShippingPackage[] | null;
};

export type AddToCartInput = {
  productId: number;
  variationId?: number | null;
  quantity: number;
};

export async function addToCartMutation(
  sessionToken: string | null | undefined,
  input: AddToCartInput,
  authToken?: string | null
) {
  const payload = {
    clientMutationId: `next-${Date.now()}`,
    productId: input.productId,
    quantity: input.quantity,
    ...(input.variationId != null && input.variationId > 0
      ? { variationId: input.variationId }
      : {}),
  };

  return wpGraphQLWithJwtRecovery<{
    addToCart?: {
      cart?: unknown;
    };
  }>(ADD_TO_CART_MUTATION, { input: payload }, sessionToken, authToken);
}

export async function removeItemsFromCartMutation(
  sessionToken: string | null | undefined,
  keys: string[],
  authToken?: string | null
) {
  const payload = {
    clientMutationId: `next-remove-${Date.now()}`,
    keys,
  };

  return wpGraphQLWithJwtRecovery<{
    removeItemsFromCart?: {
      cart?: CartQueryShape | null;
    };
  }>(REMOVE_ITEMS_FROM_CART_MUTATION, { input: payload }, sessionToken, authToken);
}

export async function updateShippingMethodMutation(
  sessionToken: string | null | undefined,
  shippingMethods: string[],
  authToken?: string | null
) {
  const payload = {
    clientMutationId: `next-ship-${Date.now()}`,
    shippingMethods,
  };

  return wpGraphQLWithJwtRecovery<{
    updateShippingMethod?: {
      cart?: CartQueryShape | null;
    };
  }>(UPDATE_SHIPPING_METHOD_MUTATION, { input: payload }, sessionToken, authToken);
}

export async function getCartQuery(
  sessionToken: string | null | undefined,
  authToken?: string | null
) {
  const session = sessionToken?.trim() || null;
  let auth = authToken;

  let result = await wpGraphQLWithJwtRecovery<{
    cart?: CartQueryShape | null;
  }>(GET_CART_QUERY, { recalculateTotals: true }, session, auth);

  let jwtWasInvalid = result.jwtWasInvalid;
  if (jwtWasInvalid) auth = null;

  /** Stale session cookie — establish a fresh WooCommerce session and retry once. */
  if (isInvalidCartTokenError(result.errors) && session) {
    const warm = await wpGraphQLWithJwtRecovery<{
      cart?: CartQueryShape | null;
    }>(GET_CART_QUERY, { recalculateTotals: true }, null, auth);
    jwtWasInvalid = jwtWasInvalid || warm.jwtWasInvalid;
    if (warm.jwtWasInvalid) auth = null;

    const freshSession = warm.sessionHeader ?? null;
    result = await wpGraphQLWithJwtRecovery<{
      cart?: CartQueryShape | null;
    }>(GET_CART_QUERY, { recalculateTotals: true }, freshSession, auth);

    return {
      ...result,
      sessionHeader: result.sessionHeader ?? freshSession,
      jwtWasInvalid: jwtWasInvalid || result.jwtWasInvalid,
    };
  }

  return { ...result, jwtWasInvalid };
}
