/** Canonical colour order for Essential Glow Bear grid rows. */
const GLOW_BEAR_COLOR_ORDER = ["matcha", "sakura", "honey", "cloud"] as const;

/** Extract the bear colour from WooCommerce titles like "The Matcha Glow Bear". */
export function parseGlowBearColor(name: string): string | null {
  const m = String(name).match(/\b(?:the\s+)?(matcha|sakura|honey|cloud)\b/i);
  if (!m) return null;
  const color = m[1].toLowerCase();
  return color.charAt(0).toUpperCase() + color.slice(1);
}

/** Short label for product cards and sibling links. */
export function glowBearCardName(fullName: string): string {
  return parseGlowBearColor(fullName) ?? fullName.trim();
}

function glowBearSortIndex(name: string): number {
  const color = parseGlowBearColor(name)?.toLowerCase();
  if (!color) return 999;
  const idx = GLOW_BEAR_COLOR_ORDER.indexOf(color as (typeof GLOW_BEAR_COLOR_ORDER)[number]);
  return idx >= 0 ? idx : 999;
}

/** Sort Essential Glow Bear products Matcha → Sakura → Honey → Cloud. */
export function sortEssentialGlowBearProducts<T extends { name: string }>(products: T[]): T[] {
  return [...products].sort((a, b) => glowBearSortIndex(a.name) - glowBearSortIndex(b.name));
}
