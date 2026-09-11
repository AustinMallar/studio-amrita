import { decodeHtmlEntities } from "./html-text";

/** Canonical colour order for Glow Bear grid rows. */
const GLOW_BEAR_COLOR_ORDER = ["matcha", "sakura", "honey", "cloud"] as const;

/** Categories whose variable products should render one catalog card per colour. */
export const GLOW_BEAR_COLOURWAY_CATEGORY_SLUGS = new Set([
  "essential-glow-bear",
  "classic-glow-bear",
  "baby-glow-bear",
]);

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

/**
 * Storefront title from a WooCommerce/Etsy name: decode entities, drop SEO tails,
 * then keep Glow Bear colour short names when the title is a colourway SKU.
 */
export function storefrontProductName(fullName: string): string {
  const decoded = decodeHtmlEntities(String(fullName ?? "")).replace(/\s+/g, " ").trim();
  if (!decoded) return "";

  const primary = decoded.split(/\s*[|]\s*/)[0]?.trim() || decoded;
  const withoutHandmadeTail = primary.replace(/\s+Handmade\b.+$/i, "").trim();
  return glowBearCardName(withoutHandmadeTail || primary);
}

export function isGlowColourAttributeName(name?: string, label?: string): boolean {
  const blob = `${name ?? ""} ${label ?? ""}`.toLowerCase();
  return /color|colour|shade|choose-your-glow|choose your glow/.test(blob);
}

/** Stable query value for `/products/[slug]?colour=`. */
export function glowColourParam(option: string): string {
  const short = parseGlowBearColor(option);
  if (short) return short.toLowerCase();
  return option
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function glowColourOptionsMatch(option: string, param: string): boolean {
  if (!option || !param) return false;
  return glowColourParam(option) === glowColourParam(param);
}

export function matchGlowColourOption(
  options: string[],
  param: string | null | undefined,
): string | null {
  if (!param) return null;
  return options.find((option) => glowColourOptionsMatch(option, param)) ?? null;
}

function glowBearSortIndex(name: string): number {
  const color = parseGlowBearColor(name)?.toLowerCase();
  if (!color) return 999;
  const idx = GLOW_BEAR_COLOR_ORDER.indexOf(color as (typeof GLOW_BEAR_COLOR_ORDER)[number]);
  return idx >= 0 ? idx : 999;
}

/** Sort Glow Bear colourways Matcha → Sakura → Honey → Cloud. */
export function sortEssentialGlowBearProducts<
  T extends { name: string; displayName?: string },
>(products: T[]): T[] {
  return [...products].sort(
    (a, b) =>
      glowBearSortIndex(a.displayName ?? a.name) - glowBearSortIndex(b.displayName ?? b.name),
  );
}
