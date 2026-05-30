import "server-only";

import type { OrderDetailData } from "@/lib/account-data";
import {
  collectGraphQLErrors,
  fetchOrderDetail,
  fetchOrderDetailWithSession,
} from "@/lib/account-data";
import { firstGraphQLErrorMessage } from "@/lib/auth-wp";
import { formatOrderDate, formatOrderStatus, lineItemLabel } from "@/lib/order-display";
import { getWordPressSiteOrigin } from "@/lib/wp-site-origin";

export type ThankYouAddressLines = { heading: string; lines: string[] };

export type ThankYouOrderView = {
  title: string;
  dateLine: string | null;
  lines: Array<{ label: string; quantity: string; total: string }>;
  shippingRows: Array<{ label: string; total: string }>;
  subtotal: string | null;
  shippingTotal: string | null;
  taxTotal: string | null;
  grandTotal: string | null;
  billing: ThankYouAddressLines;
  shipping: ThankYouAddressLines;
  paymentMethodTitle: string | null;
};

function linesFromCustomerAddress(
  a:
    | {
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
      }
    | null
    | undefined
): string[] {
  if (!a) return [];
  const parts = [
    [a.firstName, a.lastName].filter(Boolean).join(" ").trim(),
    a.company?.trim(),
    a.address1?.trim(),
    a.address2?.trim(),
    [a.city, a.state, a.postcode].filter(Boolean).join(", "),
    a.country?.trim(),
    a.email?.trim(),
    a.phone?.trim(),
  ].filter((x): x is string => Boolean(x && x.length > 0));
  return parts;
}

function thankYouFromGraphQL(order: OrderDetailData): ThankYouOrderView {
  const lineNodes = (order.lineItems?.nodes ?? []).filter(Boolean);
  const shipLines = (order.shippingLines?.nodes ?? []).filter(Boolean);

  const title =
    order.orderNumber?.trim() ||
    (order.databaseId != null ? `Order #${order.databaseId}` : "Order");

  return {
    title,
    dateLine:
      order.date && order.status
        ? `Placed ${formatOrderDate(order.date)} · ${formatOrderStatus(order.status)}`
        : order.date
          ? `Placed ${formatOrderDate(order.date)}`
          : order.status
            ? formatOrderStatus(order.status)
            : null,
    lines: lineNodes.map((item) => ({
      label: lineItemLabel(item ?? {}),
      quantity: String(item?.quantity ?? "N/A"),
      total: item?.total?.trim() || "N/A",
    })),
    shippingRows: shipLines.map((sl) => ({
      label: sl?.methodTitle?.trim() || "Shipping",
      total: sl?.total?.trim() || "N/A",
    })),
    subtotal: order.subtotal?.trim() ?? null,
    shippingTotal: order.shippingTotal?.trim() ?? null,
    taxTotal: order.totalTax?.trim() ?? null,
    grandTotal: order.total?.trim() ?? null,
    billing: {
      heading: "Billing",
      lines: linesFromCustomerAddress(order.billing),
    },
    shipping: {
      heading: "Shipping",
      lines: linesFromCustomerAddress(order.shipping),
    },
    paymentMethodTitle: order.paymentMethodTitle?.trim() ?? null,
  };
}

/** WooCommerce Store API order payload (subset). @see https://github.com/woocommerce/woocommerce-blocks/blob/trunk/src/StoreApi/docs/order.md */
type StoreApiOrder = {
  id?: number;
  status?: string;
  billing_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  items?: Array<{
    name?: string;
    quantity?: number;
    totals?: {
      line_total?: string;
      currency_code?: string;
      currency_minor_unit?: number;
    };
  }>;
  totals?: {
    total_items?: string;
    total_shipping?: string;
    total_tax?: string;
    total_price?: string;
    currency_code?: string;
    currency_minor_unit?: number;
  };
};

function minorToDisplay(
  raw: string | null | undefined,
  currencyCode: string,
  minorUnit: number
): string {
  if (raw == null || raw === "") return "N/A";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const mu = Number.isFinite(minorUnit) && minorUnit > 0 ? minorUnit : 0;
  const divisor = mu === 0 ? 1 : 10 ** mu;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(n / divisor);
  } catch {
    return String(raw);
  }
}

function thankYouFromStoreApi(o: StoreApiOrder): ThankYouOrderView {
  const firstItem = o.items?.[0];
  const currency =
    o.totals?.currency_code ||
    firstItem?.totals?.currency_code ||
    (typeof firstItem?.totals?.currency_code === "string" ? firstItem.totals.currency_code : "USD");
  const minor = o.totals?.currency_minor_unit ?? firstItem?.totals?.currency_minor_unit ?? 2;

  const lines =
    o.items?.map((item) => ({
      label: item.name?.trim() || "Item",
      quantity: String(item.quantity ?? "N/A"),
      total: minorToDisplay(item.totals?.line_total, currency, minor),
    })) ?? [];

  return {
    title: o.id != null ? `Order #${o.id}` : "Order",
    dateLine: o.status ? formatOrderStatus(o.status) : null,
    lines,
    shippingRows: [],
    subtotal: minorToDisplay(o.totals?.total_items, currency, minor),
    shippingTotal: minorToDisplay(o.totals?.total_shipping, currency, minor),
    taxTotal: minorToDisplay(o.totals?.total_tax, currency, minor),
    grandTotal: minorToDisplay(o.totals?.total_price, currency, minor),
    billing: {
      heading: "Billing",
      lines: linesFromCustomerAddress({
        firstName: o.billing_address?.first_name,
        lastName: o.billing_address?.last_name,
        company: o.billing_address?.company,
        address1: o.billing_address?.address_1,
        address2: o.billing_address?.address_2,
        city: o.billing_address?.city,
        state: o.billing_address?.state,
        postcode: o.billing_address?.postcode,
        country: o.billing_address?.country,
        email: o.billing_address?.email,
        phone: o.billing_address?.phone,
      }),
    },
    shipping: {
      heading: "Shipping",
      lines: linesFromCustomerAddress({
        firstName: o.shipping_address?.first_name,
        lastName: o.shipping_address?.last_name,
        company: o.shipping_address?.company,
        address1: o.shipping_address?.address_1,
        address2: o.shipping_address?.address_2,
        city: o.shipping_address?.city,
        state: o.shipping_address?.state,
        postcode: o.shipping_address?.postcode,
        country: o.shipping_address?.country,
        phone: o.shipping_address?.phone,
      }),
    },
    paymentMethodTitle: null,
  };
}

async function fetchStoreApiOrder(
  orderId: number,
  orderKey: string,
  billingEmail: string
): Promise<StoreApiOrder | null> {
  const origin = getWordPressSiteOrigin();
  const url = new URL(`${origin}/wp-json/wc/store/v1/order/${orderId}`);
  url.searchParams.set("key", orderKey);
  url.searchParams.set("billing_email", billingEmail);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as StoreApiOrder;
}

export type ThankYouFetchResult =
  | { ok: true; view: ThankYouOrderView }
  | { ok: false; message: string };

export async function fetchThankYouOrderView(params: {
  orderId: number;
  orderKey: string | null;
  billingEmail: string | null;
  sessionToken: string | null;
  jwt: string | null;
}): Promise<ThankYouFetchResult> {
  const { orderId, orderKey, billingEmail, sessionToken, jwt } = params;

  let jwtErr: string | null = null;
  if (jwt) {
    const r = await fetchOrderDetail(jwt, orderId);
    jwtErr = firstGraphQLErrorMessage(r.errors);
    if (!jwtErr && r.data?.order) {
      return { ok: true, view: thankYouFromGraphQL(r.data.order) };
    }
  }

  const rSession = await fetchOrderDetailWithSession(sessionToken, orderId, null);
  const sessionErr = firstGraphQLErrorMessage(rSession.errors);
  if (!sessionErr && rSession.data?.order) {
    return { ok: true, view: thankYouFromGraphQL(rSession.data.order) };
  }

  if (orderKey && billingEmail?.trim()) {
    const store = await fetchStoreApiOrder(orderId, orderKey, billingEmail.trim());
    if (store) {
      return { ok: true, view: thankYouFromStoreApi(store) };
    }
  }

  const gqlHints = [...collectGraphQLErrors(rSession.errors), jwtErr].filter(Boolean).join(" ");

  if (orderKey && !billingEmail?.trim()) {
    return {
      ok: false,
      message:
        "Add your billing email to the URL to load this order, or open this page right after checkout while your session is still active. Your confirmation email also has the full details.",
    };
  }

  return {
    ok: false,
    message:
      gqlHints ||
      "Could not load order details. Confirm the link from your confirmation email or try again later.",
  };
}
