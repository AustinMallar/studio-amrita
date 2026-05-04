import "server-only";

import { wpGraphQL } from "./wp-graphql";

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
                __typename
                ... on SimpleProduct {
                  name
                }
                ... on ProductVariation {
                  name
                }
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
              __typename
              ... on SimpleProduct {
                name
              }
              ... on ProductVariation {
                name
              }
            }
          }
        }
      }
      total
      subtotal
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

export async function getCartQuery(sessionToken: string | null | undefined) {
  return wpGraphQL<{
    cart?: {
      contents?: {
        nodes?: Array<{
          key?: string;
          quantity?: number | null;
          subtotal?: string | null;
          product?: { node?: { name?: string | null } | null } | null;
        } | null> | null;
      } | null;
      total?: string | null;
      subtotal?: string | null;
    } | null;
  }>(GET_CART_QUERY, {}, sessionToken);
}
