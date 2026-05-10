import type { OrderSummary } from "@/lib/account-data";
import { formatOrderDate, formatOrderStatus } from "@/lib/order-display";
import Link from "next/link";

export function OrdersSection({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <p className="font-sans text-sm text-body">
        No orders yet. When you shop with us, your order history will appear here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white/40">
      <table className="w-full min-w-[520px] border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] text-left text-xs font-semibold uppercase tracking-wide text-body">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const id = order.databaseId;
            const label =
              order.orderNumber?.trim() ||
              (id != null ? `#${id}` : order.id?.slice(0, 8) ?? "—");
            const href = id != null ? `/account/orders/${id}` : "#";
            return (
              <tr key={order.id ?? String(id)} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 font-medium text-heading">
                  {id != null ? (
                    <Link href={href} className="text-dusty-rose hover:underline">
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </td>
                <td className="px-4 py-3 text-body">{formatOrderDate(order.date)}</td>
                <td className="px-4 py-3 text-heading">{formatOrderStatus(order.status)}</td>
                <td className="max-w-[140px] truncate px-4 py-3 text-body">
                  {order.paymentMethodTitle?.trim() || "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-heading">{order.total ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
