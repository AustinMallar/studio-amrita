import "server-only";

import { wpGraphQL } from "./wp-graphql";

/** Default WooCommerce PayPal Payments gateway id — override with WOOCOMMERCE_PAYMENT_GATEWAY_ID. */
export const DEFAULT_PAYPAL_GATEWAY_ID = "ppcp-gateway";

export type CustomerAddressInput = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  /** When true, replaces existing session billing/shipping for guests. */
  overwrite?: boolean | null;
};

export type CheckoutMutationInput = {
  clientMutationId?: string;
  paymentMethod: string;
  shippingMethod?: string[] | null;
  shipToDifferentAddress?: boolean | null;
  billing: CustomerAddressInput;
  shipping?: CustomerAddressInput | null;
  customerNote?: string | null;
};

export type CheckoutMutationResult = {
  checkout?: {
    clientMutationId?: string | null;
    result?: string | null;
    redirect?: string | null;
    order?: {
      databaseId?: number | null;
      orderNumber?: string | null;
      orderKey?: string | null;
    } | null;
  } | null;
};

const CHECKOUT_MUTATION = `
  mutation StudioAmritaCheckout($input: CheckoutInput!) {
    checkout(input: $input) {
      clientMutationId
      result
      redirect
      order {
        databaseId
        orderNumber
        orderKey
      }
    }
  }
`;

export async function checkoutMutation(
  sessionToken: string | null | undefined,
  input: CheckoutMutationInput,
  authToken?: string | null
) {
  const payload: Record<string, unknown> = {
    clientMutationId: input.clientMutationId ?? `studio-amrita-checkout-${Date.now()}`,
    paymentMethod: input.paymentMethod,
    billing: input.billing,
    ...(input.shipToDifferentAddress != null
      ? { shipToDifferentAddress: input.shipToDifferentAddress }
      : {}),
    ...(input.shipping ? { shipping: input.shipping } : {}),
    ...(input.shippingMethod?.length ? { shippingMethod: input.shippingMethod } : {}),
    ...(input.customerNote?.trim() ? { customerNote: input.customerNote.trim() } : {}),
  };

  return wpGraphQL<CheckoutMutationResult>(
    CHECKOUT_MUTATION,
    { input: payload },
    sessionToken,
    authToken
  );
}
