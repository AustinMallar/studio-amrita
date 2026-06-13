/**
 * Host clip files under `public/` (e.g. `public/product-hover/matcha-green.mp4`)
 * and map each product by its WooCommerce slug. Used for:
 *   - Product cards (hover preview)
 *   - `/products/[slug]` (“See it in motion”)
 * Frontend clips take priority over gallery-based hover from WooCommerce.
 *
 * Example:
 *   1. Add `public/product-hover/matcha-green.mp4`
 *   2. Set `HOVER_VIDEO_BY_SLUG["matcha-green"] = "/product-hover/matcha-green.mp4"`
 */

export type FrontendHoverVideo = { url: string; kind: "video" };

export const HOVER_VIDEO_BY_SLUG: Record<string, string> = {
  "the-matcha-glow-bear-handmade-crochet-teddy-keychain-bag-charm-with-hand-cream-lip-balm":
    "/product-hover/matcha-green.mp4",
};

/** Match long Etsy-style slugs when an exact slug map entry is missing. */
const HOVER_VIDEO_BY_SLUG_FRAGMENT: Record<string, string> = {
  "matcha-glow-bear": "/product-hover/matcha-green.mp4",
};

export function getFrontendHoverVideo(slug: string): FrontendHoverVideo | null {
  if (!slug) return null;
  const path =
    HOVER_VIDEO_BY_SLUG[slug] ??
    Object.entries(HOVER_VIDEO_BY_SLUG_FRAGMENT).find(([fragment]) =>
      slug.includes(fragment)
    )?.[1];
  if (!path || typeof path !== "string") return null;
  const url = path.startsWith("/") ? path : `/${path}`;
  return { url, kind: "video" };
}
