/** WooCommerce shipping class slug — products in this class ship free within Canada. */
export const GLOW_BEAR_SHIPPING_CLASS_SLUG = "glow-bear";

/** Storefront category slugs whose products use the Glow Bear shipping class. */
export const GLOW_BEAR_CATEGORY_SLUGS = new Set([
  "essential-glow-bear",
  "classic-glow-bear",
  "baby-glow-bear",
  "glow-bears",
]);

export const SHIPPING_COPY = {
  promoBar: "Free shipping on Glow Bears within Canada. Shop now ♡",
  footerTitle: "Free Shipping",
  footerBody: "On Glow Bears within Canada.",
  faqAnswer:
    "Glow Bear products (Essential, Classic, and Baby Glow Bears) ship free within Canada. Shipping for all other items is calculated at checkout based on your address. If there’s ever an issue, our customer service is ready to help.",
  pdpCallout: "Free shipping within Canada on this Glow Bear.",
  metaSuffix: "Free shipping on Glow Bears within Canada.",
} as const;

export function productQualifiesForGlowBearFreeShipping(
  categorySlugs: string[] | null | undefined
): boolean {
  if (!categorySlugs?.length) return false;
  return categorySlugs.some((slug) => GLOW_BEAR_CATEGORY_SLUGS.has(slug));
}
