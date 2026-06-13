import { GLOW_BEAR_LINE_NAMES, PRODUCT_NAMES } from "./product-names";

/** WooCommerce shipping class slug — products in this class ship free worldwide. */
export const GLOW_BEAR_SHIPPING_CLASS_SLUG = "glow-bear";

/** Storefront category slugs whose products use the Glow Bear shipping class. */
export const GLOW_BEAR_CATEGORY_SLUGS = new Set([
  "essential-glow-bear",
  "classic-glow-bear",
  "baby-glow-bear",
  "glow-bears",
]);

export const SHIPPING_COPY = {
  promoBar: `Free shipping on all ${PRODUCT_NAMES.glowBears} worldwide. Shop now ♡`,
  footerTitle: "Free Shipping",
  footerBody: `On ${PRODUCT_NAMES.glowBears} worldwide.`,
  faqAnswer:
    `${PRODUCT_NAMES.glowBear} products (${GLOW_BEAR_LINE_NAMES}) ship free worldwide. Shipping for all other items is calculated at checkout based on your address. If there’s ever an issue, our customer service is ready to help.`,
  pdpCallout: `Free shipping worldwide on this ${PRODUCT_NAMES.glowBear}.`,
  metaSuffix: `Free shipping on all ${PRODUCT_NAMES.glowBears} worldwide.`,
} as const;

export function productQualifiesForGlowBearFreeShipping(
  categorySlugs: string[] | null | undefined
): boolean {
  if (!categorySlugs?.length) return false;
  return categorySlugs.some((slug) => GLOW_BEAR_CATEGORY_SLUGS.has(slug));
}
