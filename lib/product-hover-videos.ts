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
  "matcha-green": "/product-hover/matcha-green.mp4",
};

export function getFrontendHoverVideo(slug: string): FrontendHoverVideo | null {
  if (!slug) return null;
  const path = HOVER_VIDEO_BY_SLUG[slug];
  if (!path || typeof path !== "string") return null;
  const url = path.startsWith("/") ? path : `/${path}`;
  return { url, kind: "video" };
}
