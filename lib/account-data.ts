import "server-only";

import { wpGraphQL } from "./wp-graphql";

/** Billing/shipping shape from `customer { billing shipping }` — maps to `CustomerAddressInput` on mutations. */
export type CustomerAddress = {
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
};

export type OrderSummary = {
  id?: string | null;
  databaseId?: number | null;
  orderNumber?: string | null;
  date?: string | null;
  status?: string | null;
  total?: string | null;
  paymentMethodTitle?: string | null;
};

export type AccountOverviewData = {
  viewer?: {
    id?: string | null;
    databaseId?: number | null;
    username?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  customer?: {
    databaseId?: number | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    username?: string | null;
    orderCount?: number | null;
    totalSpent?: number | null;
    billing?: CustomerAddress | null;
    shipping?: CustomerAddress | null;
    orders?: {
      nodes?: Array<OrderSummary | null> | null;
    } | null;
  } | null;
};

const ACCOUNT_OVERVIEW_QUERY = `
  query StudioAmritaAccountOverview {
    viewer {
      id
      databaseId
      username
      email
      firstName
      lastName
    }
    customer {
      databaseId
      email
      firstName
      lastName
      displayName
      username
      orderCount
      totalSpent
      billing {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        email
        phone
      }
      shipping {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        phone
      }
      orders(first: 25) {
        nodes {
          id
          databaseId
          orderNumber
          date
          status
          total
          paymentMethodTitle
        }
      }
    }
  }
`;

export type OrderDetailData = {
  databaseId?: number | null;
  orderNumber?: string | null;
  date?: string | null;
  modified?: string | null;
  status?: string | null;
  currency?: string | null;
  paymentMethodTitle?: string | null;
  total?: string | null;
  subtotal?: string | null;
  shippingTotal?: string | null;
  totalTax?: string | null;
  billing?: CustomerAddress | null;
  shipping?: CustomerAddress | null;
  lineItems?: {
    nodes?: Array<{
      quantity?: number | null;
      subtotal?: string | null;
      total?: string | null;
      product?: {
        node?: {
          __typename?: string;
          name?: string | null;
        } | null;
      } | null;
      variation?: {
        node?: {
          name?: string | null;
        } | null;
      } | null;
    } | null> | null;
  } | null;
  shippingLines?: {
    nodes?: Array<{
      methodTitle?: string | null;
      total?: string | null;
    } | null> | null;
  } | null;
};

const ORDER_DETAIL_QUERY = `
  query StudioAmritaOrderDetail($id: ID!, $idType: OrderIdTypeEnum!) {
    order(id: $id, idType: $idType) {
      databaseId
      orderNumber
      date
      modified
      status
      currency
      paymentMethodTitle
      total
      subtotal
      shippingTotal
      totalTax
      billing {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        email
        phone
      }
      shipping {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        phone
      }
      lineItems {
        nodes {
          quantity
          subtotal
          total
          product {
            node {
              __typename
              ... on SimpleProduct {
                name
              }
              ... on VariableProduct {
                name
              }
            }
          }
          variation {
            node {
              name
            }
          }
        }
      }
      shippingLines {
        nodes {
          methodTitle
          total
        }
      }
    }
  }
`;

export async function fetchAccountOverview(authToken: string) {
  return wpGraphQL<AccountOverviewData>(
    ACCOUNT_OVERVIEW_QUERY,
    undefined,
    null,
    authToken
  );
}

export async function fetchOrderDetail(authToken: string, databaseId: number) {
  return wpGraphQL<{ order?: OrderDetailData | null }>(
    ORDER_DETAIL_QUERY,
    {
      id: String(databaseId),
      idType: "DATABASE_ID",
    },
    null,
    authToken
  );
}

/** Guest / session context — may succeed right after checkout when the WooCommerce session matches. */
export async function fetchOrderDetailWithSession(
  sessionToken: string | null | undefined,
  databaseId: number,
  authToken?: string | null
) {
  return wpGraphQL<{ order?: OrderDetailData | null }>(
    ORDER_DETAIL_QUERY,
    {
      id: String(databaseId),
      idType: "DATABASE_ID",
    },
    sessionToken ?? null,
    authToken ?? null
  );
}

export function collectGraphQLErrors(
  errors?: Array<{ message?: string }> | null
): string[] {
  if (!errors?.length) return [];
  return errors
    .map((e) => (typeof e?.message === "string" ? e.message.trim() : ""))
    .filter(Boolean);
}
