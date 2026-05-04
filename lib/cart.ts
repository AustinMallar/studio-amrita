import "server-only";

import type { CartProductNode } from "./cart-product-image";
import { wpGraphQL } from "./wp-graphql";

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

export const ADD_TO_CART_MUTATION = `
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      cart {
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
      }
    }
  }
`;

export const GET_CART_QUERY = `
  query GetCart {
    cart {
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
    }
  }
`;

const CART_FRAGMENT_RESPONSE = `
  cart {
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
  }
`;

export const REMOVE_ITEMS_FROM_CART_MUTATION = `
  mutation RemoveItemsFromCart($input: RemoveItemsFromCartInput!) {
    removeItemsFromCart(input: $input) {
      ${CART_FRAGMENT_RESPONSE}
    }
  }
`;

export type AddToCartInput = {
  productId: number;
  variationId?: number | null;
  quantity: number;
};

export async function addToCartMutation(
  sessionToken: string | null | undefined,
  input: AddToCartInput
) {
  const payload = {
    clientMutationId: `next-${Date.now()}`,
    productId: input.productId,
    quantity: input.quantity,
    ...(input.variationId != null && input.variationId > 0
      ? { variationId: input.variationId }
      : {}),
  };

  return wpGraphQL<{
    addToCart?: {
      cart?: unknown;
    };
  }>(ADD_TO_CART_MUTATION, { input: payload }, sessionToken);
}

export async function removeItemsFromCartMutation(
  sessionToken: string | null | undefined,
  keys: string[]
) {
  const payload = {
    clientMutationId: `next-remove-${Date.now()}`,
    keys,
  };

  return wpGraphQL<{
    removeItemsFromCart?: {
      cart?: {
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
      } | null;
    };
  }>(REMOVE_ITEMS_FROM_CART_MUTATION, { input: payload }, sessionToken);
}

export async function getCartQuery(sessionToken: string | null | undefined) {
  return wpGraphQL<{
    cart?: {
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
    } | null;
  }>(GET_CART_QUERY, {}, sessionToken);
}
