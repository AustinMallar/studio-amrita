import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import {
  collectGraphQLErrors,
  fetchOrderDetail,
  type CustomerAddress,
} from "@/lib/account-data";
import { getJwtAuthToken } from "@/lib/auth-session";
import { formatOrderDate, formatOrderStatus, lineItemLabel } from "@/lib/order-display";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function lines(a: CustomerAddress | null | undefined): string[] {
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

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId: rawId } = await params;
  const databaseId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(databaseId) || databaseId <= 0) {
    notFound();
  }

  const token = await getJwtAuthToken();
  if (!token) {
    redirect(`/login?next=/account/orders/${databaseId}`);
  }

  let result: Awaited<ReturnType<typeof fetchOrderDetail>>;
  try {
    result = await fetchOrderDetail(token, databaseId);
  } catch {
    result = {
      errors: [{ message: "Network error" }],
      data: undefined,
      sessionHeader: null,
    };
  }

  const gqlErrors = collectGraphQLErrors(result.errors);
  const order = result.data?.order ?? null;

  if (!order && gqlErrors.some((e) => /not authorized|no order exists|invalid/i.test(e))) {
    notFound();
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        <PromoBar />
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
          <Link href="/account" className="font-sans text-sm text-dusty-rose hover:underline">
            ← Back to account
          </Link>
          <h1 className="font-heading text-2xl text-heading">Order</h1>
          <p className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3 font-sans text-sm text-heading">
            {gqlErrors.join(" ") || "Could not load this order."}
          </p>
        </main>
        <FooterValues />
      </div>
    );
  }

  const title =
    order.orderNumber?.trim() ||
    (order.databaseId != null ? `Order #${order.databaseId}` : "Order");

  const lineNodes = (order.lineItems?.nodes ?? []).filter(Boolean);
  const shipLines = (order.shippingLines?.nodes ?? []).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/account#orders" className="text-dusty-rose hover:underline">
            ← Back to orders
          </Link>
        </nav>

        <header>
          <h1 className="font-heading text-3xl text-heading">{title}</h1>
          <p className="mt-2 font-sans text-sm text-body">
            Placed {formatOrderDate(order.date)} · {formatOrderStatus(order.status)}
            {order.paymentMethodTitle?.trim() ? ` · ${order.paymentMethodTitle.trim()}` : ""}
          </p>
        </header>

        <section className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 font-sans text-sm sm:px-7">
          <h2 className="font-heading text-lg text-heading">Items</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] text-left text-xs font-semibold uppercase tracking-wide text-body">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineNodes.map((item, i) => (
                  <tr key={`line-${i}`} className="border-b border-black/[0.04] last:border-0">
                    <td className="py-3 pr-4 text-heading">{lineItemLabel(item ?? {})}</td>
                    <td className="py-3 pr-4 text-body">{item?.quantity ?? "N/A"}</td>
                    <td className="py-3 text-right font-medium text-heading">{item?.total ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {shipLines.length > 0 ? (
            <div className="mt-6 border-t border-black/[0.06] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body">Shipping</p>
              <ul className="mt-2 space-y-1 text-body">
                {shipLines.map((sl, i) => (
                  <li key={`ship-${i}`} className="flex justify-between gap-4">
                    <span>{sl?.methodTitle ?? "Shipping"}</span>
                    <span className="font-medium text-heading">{sl?.total ?? "N/A"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="mt-6 space-y-2 border-t border-black/[0.06] pt-4 text-sm">
            {order.subtotal ? (
              <div className="flex justify-between text-body">
                <dt>Subtotal</dt>
                <dd className="text-heading">{order.subtotal}</dd>
              </div>
            ) : null}
            {order.shippingTotal ? (
              <div className="flex justify-between text-body">
                <dt>Shipping</dt>
                <dd className="text-heading">{order.shippingTotal}</dd>
              </div>
            ) : null}
            {order.totalTax ? (
              <div className="flex justify-between text-body">
                <dt>Tax</dt>
                <dd className="text-heading">{order.totalTax}</dd>
              </div>
            ) : null}
            {order.total ? (
              <div className="flex justify-between text-base font-semibold text-heading">
                <dt>Total</dt>
                <dd>{order.total}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 font-sans text-sm sm:px-7">
            <h2 className="font-heading text-lg text-heading">Billing</h2>
            <address className="mt-3 not-italic leading-relaxed text-body">
              {lines(order.billing).length > 0 ? (
                lines(order.billing).map((ln, i) => (
                  <span key={`b-${i}`} className="block">
                    {ln}
                  </span>
                ))
              ) : (
                <span>Not provided</span>
              )}
            </address>
          </section>
          <section className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 font-sans text-sm sm:px-7">
            <h2 className="font-heading text-lg text-heading">Shipping</h2>
            <address className="mt-3 not-italic leading-relaxed text-body">
              {lines(order.shipping).length > 0 ? (
                lines(order.shipping).map((ln, i) => (
                  <span key={`s-${i}`} className="block">
                    {ln}
                  </span>
                ))
              ) : (
                <span>Not provided</span>
              )}
            </address>
          </section>
        </div>
      </main>
      <FooterValues />
    </div>
  );
}
