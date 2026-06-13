import { parseGlowBearColor } from "@/lib/product-display";

/**
 * Studio Amrita Glow Bear palette — match product titles / attribute labels to swatch colours.
 * WooCommerce often exposes every global “Colour” option on each simple product; we infer the
 * actual variant from the product name when `options.length > 1`.
 */

const RULES: Array<{ test: (blob: string) => boolean; hex: string }> = [
  {
    test: (b) => /\bmatcha\b/i.test(b) || /\bmatcha\s*green\b/i.test(b),
    hex: "#BDCAB7",
  },
  {
    test: (b) => /\bsakura\b/i.test(b) || /\bsakura\s*pink\b/i.test(b),
    hex: "#E6B9BC",
  },
  {
    test: (b) =>
      /\bhoney\s*brown\b/i.test(b) || (/\bhoney\b/i.test(b) && !/\bhoney\s*(bow|charm)/i.test(b)),
    hex: "#AA9183",
  },
  {
    test: (b) => /\bcloud\s*cream\b/i.test(b) || (/\bcloud\b/i.test(b) && !/\bcloud\s*bow\b/i.test(b)),
    hex: "#CAC8C4",
  },
];

const LEGACY_NAMED: Record<string, string> = {
  matcha: "#BDCAB7",
  "matcha green": "#BDCAB7",
  sakura: "#E6B9BC",
  "sakura pink": "#E6B9BC",
  honey: "#AA9183",
  "honey brown": "#AA9183",
  cloud: "#CAC8C4",
  "cloud cream": "#CAC8C4",
  "rose gold": "#e4a8a8",
};

function normalizeBlob(option: string, productName?: string): string {
  return `${productName ?? ""} ${option}`.trim().toLowerCase();
}

/** Resolve a CSS colour for a WooCommerce option label and/or product title. */
export function optionToSwatchColor(option: string, productName?: string): string {
  const blob = normalizeBlob(option, productName);

  for (const { test, hex } of RULES) {
    if (test(blob)) return hex;
  }

  const key = option.trim().toLowerCase();
  if (LEGACY_NAMED[key]) return LEGACY_NAMED[key];

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key))
    return key.startsWith("#") ? key : `#${key}`;

  const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue} 38% 68%)`;
}

/** Products that should not show colour dots on catalog cards. */
const NO_CARD_SWATCHES_BY_SLUG = new Set([
  "the-petal-pouch-crochet-pouch-with-flap-pdf-pattern-only",
]);

/** Fixed swatch label when WooCommerce has no colour attribute. */
const CARD_SWATCH_LABEL_BY_SLUG: Record<string, string> = {
  "the-glow-sun-charm-beauty-of-joseon-relief-sunscreen-korean-skincare-keychain-bag-accessory":
    "Cloud Cream",
  "the-glow-berry-handmade-crochet-pink-strawberry-keychain-bag-charm": "Sakura Pink",
};

/** Standard Studio Amrita yarn shades — when most options match, show all on the card. */
function isStudioColourPalette(options: string[]): boolean {
  if (options.length < 2) return false;
  const colourLike = options.filter((o) =>
    /\b(matcha|sakura|honey|cloud|pink|green|brown|cream)\b/i.test(o)
  );
  return colourLike.length >= Math.min(4, options.length);
}

/**
 * Decide which attribute labels to render as dots on a card.
 * When WooCommerce returns the full global option list on every SKU, prefer the title match.
 */
export function swatchLabelsForProduct(
  productName: string,
  attributeOptions: string[],
  slug?: string
): string[] {
  if (slug && NO_CARD_SWATCHES_BY_SLUG.has(slug)) return [];

  const fixedLabel = slug ? CARD_SWATCH_LABEL_BY_SLUG[slug] : undefined;
  if (fixedLabel) return [fixedLabel];

  const name = productName.trim();
  const opts = attributeOptions.filter(Boolean);

  if (opts.length === 1) return opts;

  if (isStudioColourPalette(opts)) return opts.slice(0, 4);

  if (opts.length > 1 && name) {
    const n = name.toLowerCase();
    const inferred = opts.find((o) => {
      const oLower = o.toLowerCase();
      if (/\bsakura\b/i.test(n) && /\bsakura|pink\b/i.test(oLower)) return true;
      if (/\bmatcha\b/i.test(n) && /\bmatcha|green\b/i.test(oLower)) return true;
      if (/\bhoney\b/i.test(n) && /\bhoney|brown\b/i.test(oLower)) return true;
      if (/\bcloud\b/i.test(n) && /\bcloud|cream\b/i.test(oLower)) return true;
      const words = n.split(/\s+/).filter((w) => w.length > 2);
      return words.some((w) => oLower.includes(w));
    });
    if (inferred) return [inferred];

    if (/\b(sakura|matcha|honey|cloud)\b/i.test(n)) return [name];
  }

  if (opts.length > 1 && name && /\b(sakura|matcha|honey|cloud)\b/i.test(name))
    return [name.trim()];

  const color = parseGlowBearColor(name);
  if (color) return [color];

  return opts.length ? opts.slice(0, 4) : [];
}
