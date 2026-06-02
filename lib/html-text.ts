const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  copy: "\u00A9",
  reg: "\u00AE",
  trade: "\u2122",
};

/** Decode numeric and common named HTML entities from WordPress/WooCommerce content. */
export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#(?:x[0-9a-fA-F]+|\d+)|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }

    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }

    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Strip HTML tags and decode entities for plain-text display. */
export function htmlToPlainText(
  html: string,
  options?: { collapseWhitespace?: boolean },
): string {
  const tagReplacement = options?.collapseWhitespace ? " " : "";
  const withoutTags = html.replace(/<[^>]+>/g, tagReplacement);
  const decoded = decodeHtmlEntities(withoutTags);
  return options?.collapseWhitespace ? decoded.replace(/\s+/g, " ").trim() : decoded.trim();
}
