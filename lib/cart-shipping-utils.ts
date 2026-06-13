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

export type FlatShippingRate = {
  id: string;
  label: string;
  cost: string | null;
};

type ShippingPackageLike = {
  rates?: Array<{
    id?: string | null;
    label?: string | null;
    cost?: string | null;
  } | null> | null;
} | null;

/** Parse WooCommerce / GraphQL cost strings (e.g. "$12.00") for comparison. */
export function parseShippingCostAmount(cost: string | null | undefined): number {
  if (cost == null) return Number.POSITIVE_INFINITY;
  const trimmed = String(cost).trim();
  if (trimmed === "") return Number.POSITIVE_INFINITY;
  const n = parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

/** Pick the lowest-cost rate in a list. */
export function cheapestFlatRate(rates: FlatShippingRate[]): FlatShippingRate | null {
  if (rates.length === 0) return null;
  return rates.reduce((best, rate) =>
    parseShippingCostAmount(rate.cost) < parseShippingCostAmount(best.cost) ? rate : best
  );
}

/**
 * When the session has no valid / non-optimal shipping choice, return the cheapest rate id
 * per WooCommerce package (one id per package index).
 */
export function cheapestShippingMethodChoice(
  packages: ShippingPackageLike[] | null | undefined,
  chosen: string[] | null | undefined
): string[] | null {
  if (!packages?.length) return null;

  const next: string[] = [];
  let shouldUpdate = false;

  for (let i = 0; i < packages.length; i++) {
    const rates = (packages[i]?.rates ?? []).filter(
      (r): r is { id: string; cost?: string | null } => Boolean(r?.id)
    );
    if (rates.length === 0) {
      if (chosen?.[i]) shouldUpdate = true;
      continue;
    }

    const flat: FlatShippingRate[] = rates.map((r) => ({
      id: String(r.id),
      label: "Shipping",
      cost: r.cost != null && String(r.cost).length > 0 ? String(r.cost) : null,
    }));
    const cheapest = cheapestFlatRate(flat);
    if (!cheapest) continue;

    const chosenId = chosen?.[i] ?? null;
    const chosenRate = chosenId ? flat.find((r) => r.id === chosenId) : undefined;
    const pick =
      !chosenRate ||
      parseShippingCostAmount(chosenRate.cost) > parseShippingCostAmount(cheapest.cost)
        ? cheapest.id
        : chosenRate.id;

    next.push(pick);
    if (pick !== chosenId) shouldUpdate = true;
  }

  if (!shouldUpdate || next.length === 0) return null;
  return next;
}

export function flattenShippingRates(
  packages: ShippingPackageLike[] | null | undefined
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
