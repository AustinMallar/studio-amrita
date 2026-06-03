/** Public site constants used for metadata and JSON-LD. */
export const SITE = {
  name: "Studio Amrita",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioamrita.ca").replace(/\/$/, ""),
  description:
    "Handmade crochet bear keychains and Glow Bears from Studio Amrita — kawaii amigurumi gifts, thoughtfully crafted and gift-ready.",
  email: "shop@studioamrita.ca",
  logoPath: "/Studio-Amrita-Logo.png",
  defaultOgImage: "https://studioamrita.ca/category-essential-glow-bear.jpg",
  /** WooCommerce storefront currency for structured data offers. */
  currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "CAD",
} as const;

export function absoluteUrl(path = ""): string {
  if (!path) return SITE.url;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
