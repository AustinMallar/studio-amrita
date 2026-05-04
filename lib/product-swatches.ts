/**
 * Studio Amrita Glow Bear palette — match product titles / attribute labels to swatch colours.
 * WooCommerce often exposes every global “Colour” option on each simple product; we infer the
 * actual variant from the product name when `options.length > 1`.
 */

const RULES: Array<{ test: (blob: string) => boolean; hex: string }> = [
  // Matcha — muted sage green (bear + gift box)
  {
    test: (b) => /\bmatcha\b/i.test(b) || /\bmatcha\s*green\b/i.test(b),
    hex: "#7d956f",
  },
  // Sakura — dusty rose pink
  {
    test: (b) => /\bsakura\b/i.test(b) || /\bsakura\s*pink\b/i.test(b),
    hex: "#e598a8",
  },
  // Honey — warm brown / amber (matches crochet bear tone)
  {
    test: (b) =>
      /\bhoney\s*brown\b/i.test(b) || (/\bhoney\b/i.test(b) && !/\bhoney\s*(bow|charm)/i.test(b)),
    hex: "#a07852",
  },
  // Cloud — soft cream / off-white
  {
    test: (b) => /\bcloud\s*cream\b/i.test(b) || (/\bcloud\b/i.test(b) && !/\bcloud\s*bow\b/i.test(b)),
    hex: "#ebe4d8",
  },
];

const LEGACY_NAMED: Record<string, string> = {
  matcha: "#7d956f",
  "matcha green": "#7d956f",
  sakura: "#e598a8",
  "sakura pink": "#e598a8",
  honey: "#a07852",
  "honey brown": "#a07852",
  cloud: "#ebe4d8",
  "cloud cream": "#ebe4d8",
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

/**
 * Decide which attribute labels to render as dots on a card.
 * When WooCommerce returns the full global option list on every SKU, prefer the title match.
 */
export function swatchLabelsForProduct(productName: string, attributeOptions: string[]): string[] {
  const name = productName.trim();
  const opts = attributeOptions.filter(Boolean);

  if (opts.length === 1) return opts;

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

  return opts.length ? opts : name ? [name] : [];
}
