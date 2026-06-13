/** WooCommerce shipping class slug — must match the class created in WooCommerce admin. */
export const GLOW_BEAR_SHIPPING_CLASS_SLUG =
  process.env.WC_GLOW_BEAR_SHIPPING_CLASS?.trim() || "glow-bear";

const GLOW_BEAR_CATEGORY_SLUGS = new Set([
  "essential-glow-bear",
  "classic-glow-bear",
  "baby-glow-bear",
  "glow-bears",
]);

/** Assign the Glow Bear shipping class when importing listings in glow-bear categories. */
export function shippingClassForListing(
  categorySlug: string | null | undefined,
  title: string
): string | undefined {
  if (categorySlug && GLOW_BEAR_CATEGORY_SLUGS.has(categorySlug)) {
    return GLOW_BEAR_SHIPPING_CLASS_SLUG;
  }

  const normalized = title.toLowerCase();
  if (normalized.includes("glow bear") && !normalized.includes("pattern")) {
    return GLOW_BEAR_SHIPPING_CLASS_SLUG;
  }

  return undefined;
}
