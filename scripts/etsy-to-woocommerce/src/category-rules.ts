import { readFileSync, existsSync } from "node:fs";
import { PATHS } from "./config.js";
import type { EtsyListing } from "./types.js";

export type CategoryRuleEntry = {
  contains: string;
  wc_slug: string;
};

export type CategoryRules = {
  categories: Record<string, string>;
  /** Etsy listing_id → WooCommerce category slug (most reliable for CSV import). */
  listing_ids?: Record<string, string>;
  title_contains: CategoryRuleEntry[];
};

export function loadCategoryRules(): CategoryRules {
  if (!existsSync(PATHS.categoryRules)) {
    return { categories: {}, title_contains: [] };
  }
  return JSON.parse(readFileSync(PATHS.categoryRules, "utf8")) as CategoryRules;
}

export function categoryNameForSlug(
  slug: string,
  rules: CategoryRules
): string {
  return (
    rules.categories[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** Resolve WooCommerce category slug from Etsy shop section rules. */
export function resolveCategorySlug(
  listing: EtsyListing,
  rules: CategoryRules
): string | null {
  const byId = rules.listing_ids?.[String(listing.listing_id)];
  if (byId) return byId;

  const title = listing.title.toLowerCase();
  for (const rule of rules.title_contains) {
    if (title.includes(rule.contains.toLowerCase())) {
      return rule.wc_slug;
    }
  }

  return null;
}
