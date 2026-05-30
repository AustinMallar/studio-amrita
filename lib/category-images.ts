/**
 * Frontend category hero images under `public/` — override WooCommerce category thumbnails.
 * Map by WooCommerce category slug.
 */

export type FrontendCategoryImage = { url: string; alt: string };

export const CATEGORY_IMAGE_BY_SLUG: Record<string, FrontendCategoryImage> = {
  "essential-glow-bear": {
    url: "/category-essential-glow-bear.jpg",
    alt: "Essential Glow Bear gift sets in sakura pink, cloud cream, honey brown, and matcha green",
  },
};

export function getFrontendCategoryImage(slug: string): FrontendCategoryImage | null {
  if (!slug) return null;
  const entry = CATEGORY_IMAGE_BY_SLUG[slug];
  if (!entry?.url) return null;
  const url = entry.url.startsWith("/") ? entry.url : `/${entry.url}`;
  return { url, alt: entry.alt };
}
