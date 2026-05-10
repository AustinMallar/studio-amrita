import "server-only";

/** Origin (scheme + host + optional port) for the WordPress site, derived from WORDPRESS_API_URL. */
export function getWordPressSiteOrigin(): string {
  const raw = process.env.WORDPRESS_API_URL;
  if (!raw || typeof raw !== "string") {
    throw new Error("WORDPRESS_API_URL is not configured");
  }
  return new URL(raw.trim()).origin;
}
