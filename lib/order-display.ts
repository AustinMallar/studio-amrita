/** Display WooCommerce order status slug as readable text. */
export function formatOrderStatus(status: string | null | undefined): string {
  if (!status || typeof status !== "string") return "N/A";
  return status
    .replace(/^wc-/i, "")
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function lineItemLabel(item: {
  product?: { node?: { name?: string | null } | null } | null;
  variation?: { node?: { name?: string | null } | null } | null;
}): string {
  const v = item.variation?.node?.name?.trim();
  if (v) return v;
  const p = item.product?.node?.name?.trim();
  if (p) return p;
  return "Item";
}
