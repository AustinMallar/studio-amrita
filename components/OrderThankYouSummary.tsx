import type { ThankYouOrderView } from "@/lib/order-thank-you";

export function OrderThankYouSummary({ view }: { view: ThankYouOrderView }) {
  const headerLine = [view.dateLine, view.paymentMethodTitle?.trim() ? ` · ${view.paymentMethodTitle.trim()}` : ""]
    .filter(Boolean)
    .join("");

  return (
    <>
      <header>
        <h1 className="font-heading text-3xl text-heading">{view.title}</h1>
        {headerLine ? <p className="mt-2 font-sans text-sm text-body">{headerLine}</p> : null}
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
              {view.lines.map((item, i) => (
                <tr key={`line-${i}`} className="border-b border-black/[0.04] last:border-0">
                  <td className="py-3 pr-4 text-heading">{item.label}</td>
                  <td className="py-3 pr-4 text-body">{item.quantity}</td>
                  <td className="py-3 text-right font-medium text-heading">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {view.shippingRows.length > 0 ? (
          <div className="mt-6 border-t border-black/[0.06] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Shipping</p>
            <ul className="mt-2 space-y-1 text-body">
              {view.shippingRows.map((sl, i) => (
                <li key={`ship-${i}`} className="flex justify-between gap-4">
                  <span>{sl.label}</span>
                  <span className="font-medium text-heading">{sl.total}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <dl className="mt-6 space-y-2 border-t border-black/[0.06] pt-4 text-sm">
          {view.subtotal ? (
            <div className="flex justify-between text-body">
              <dt>Subtotal</dt>
              <dd className="text-heading">{view.subtotal}</dd>
            </div>
          ) : null}
          {view.shippingTotal ? (
            <div className="flex justify-between text-body">
              <dt>Shipping</dt>
              <dd className="text-heading">{view.shippingTotal}</dd>
            </div>
          ) : null}
          {view.taxTotal ? (
            <div className="flex justify-between text-body">
              <dt>Tax</dt>
              <dd className="text-heading">{view.taxTotal}</dd>
            </div>
          ) : null}
          {view.grandTotal ? (
            <div className="flex justify-between text-base font-semibold text-heading">
              <dt>Total</dt>
              <dd>{view.grandTotal}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 font-sans text-sm sm:px-7">
          <h2 className="font-heading text-lg text-heading">{view.billing.heading}</h2>
          <address className="mt-3 not-italic leading-relaxed text-body">
            {view.billing.lines.length > 0 ? (
              view.billing.lines.map((ln, i) => (
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
          <h2 className="font-heading text-lg text-heading">{view.shipping.heading}</h2>
          <address className="mt-3 not-italic leading-relaxed text-body">
            {view.shipping.lines.length > 0 ? (
              view.shipping.lines.map((ln, i) => (
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
    </>
  );
}
