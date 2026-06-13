/** Shared helpers for Etsy → WooCommerce mapping. */

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function etsyPriceToString(
  amount: number,
  divisor: number,
  decimals = 2
): string {
  const value = amount / divisor;
  return value.toFixed(decimals);
}

export function normalizeDescription(text: string | undefined): string {
  if (!text?.trim()) return "";
  const trimmed = text.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p.replace(/\n/g, " "))}</p>`)
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stableListingId(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2_000_000_000 || 1;
}

export function extractListingIdFromUrl(url: string): number | null {
  const match = url.match(/\/listing\/(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function parentSku(listingId: number): string {
  return `etsy-listing-${listingId}`;
}

export function variationSku(
  listingId: number,
  productId: number,
  sku?: string
): string {
  const trimmed = sku?.trim();
  if (trimmed) return trimmed;
  return `etsy-${listingId}-${productId}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 5;
  const baseDelayMs = opts.baseDelayMs ?? 1000;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < maxAttempts) {
        await sleep(baseDelayMs * attempt);
        continue;
      }
      if (attempt < maxAttempts && (status === 502 || status === 503)) {
        await sleep(baseDelayMs * attempt);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Prefer Color/Colour attribute names for Studio Amrita swatch matching. */
export function normalizeAttributeName(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower === "color" || lower === "colour") return "Color";
  return name.trim();
}

export function hasMeaningfulVariations(
  products: Array<{ property_values: Array<{ values: string[] }> }>
): boolean {
  if (products.length <= 1) return false;
  return products.some((p) =>
    p.property_values.some((pv) => pv.values.some((v) => v.trim()))
  );
}
