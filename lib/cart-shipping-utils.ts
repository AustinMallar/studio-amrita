/** Flatten WooGraphQL `availableShippingMethods[].rates` for UI (no server-only deps). */

/**
 * Show FREE for zero-amount shipping (e.g. "$0.00"); pass through Woo-formatted strings otherwise.
 */
export function formatShippingCostForDisplay(cost: string | null | undefined): string {
  if (cost == null) return "N/A";
  const trimmed = String(cost).trim();
  if (trimmed === "") return "N/A";
  const n = parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  if (Number.isFinite(n) && n === 0) return "FREE";
  return trimmed;
}

export type FlatShippingRate = {  id: string;
  label: string;
  cost: string | null;
};

export function flattenShippingRates(
  packages:
    | Array<{
        rates?: Array<{
          id?: string | null;
          label?: string | null;
          cost?: string | null;
        } | null> | null;
      } | null>
    | null
    | undefined
): FlatShippingRate[] {
  if (!Array.isArray(packages)) return [];
  const out: FlatShippingRate[] = [];
  for (const pkg of packages) {
    for (const r of pkg?.rates ?? []) {
      if (r?.id) {
        out.push({
          id: String(r.id),
          label: String(r.label ?? "Shipping"),
          cost: r.cost != null && String(r.cost).length > 0 ? String(r.cost) : null,
        });
      }
    }
  }
  return out;
}
