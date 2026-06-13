import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCategoryMap, PATHS } from "./config.js";
import {
  categoryNameForSlug,
  loadCategoryRules,
  resolveCategorySlug,
} from "./category-rules.js";
import { mapListingToWoo } from "./map-listing.js";
import { ImportReporter } from "./report.js";
import type { EtsyExportSnapshot } from "./types.js";
import { WooClient } from "./woo-client.js";

function parseArgs(argv: string[]): { dryRun: boolean; listingId?: number } {
  let dryRun = false;
  let listingId: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    if (argv[i] === "--listing-id" && argv[i + 1]) {
      listingId = Number(argv[i + 1]);
      i++;
    }
  }
  return { dryRun, listingId };
}

async function resolveUniqueSlug(
  woo: WooClient,
  desiredSlug: string,
  listingId: number,
  existingProductId?: number
): Promise<string> {
  const collision = await woo.findProductBySlug(desiredSlug);
  if (!collision || collision.id === existingProductId) return desiredSlug;

  const ownedByOther = await woo.slugOwnedByOtherListing(desiredSlug, listingId);
  if (ownedByOther) {
    return `${desiredSlug}-etsy-${listingId}`;
  }

  return `${desiredSlug}-etsy-${listingId}`;
}

export async function runImport(argv = process.argv.slice(2)): Promise<void> {
  const { dryRun, listingId } = parseArgs(argv);
  if (!existsSync(PATHS.exportFile)) {
    throw new Error(
      `Export file not found: ${PATHS.exportFile}\n` +
        "Run `npm run export` (API) or `npm run import-from-csv -- your-file.csv` (CSV)."
    );
  }

  const snapshot = JSON.parse(readFileSync(PATHS.exportFile, "utf8")) as EtsyExportSnapshot;
  let listings = snapshot.listings;
  if (listingId) {
    listings = listings.filter((l) => l.listing_id === listingId);
    if (!listings.length) {
      throw new Error(`Listing ${listingId} not found in export`);
    }
  }

  const categoryMap = loadCategoryMap();
  const categoryRules = loadCategoryRules();
  const woo = dryRun ? null : new WooClient();
  const reporter = new ImportReporter();
  const categoryCache = new Map<string, number>();

  console.log(
    dryRun
      ? `Dry run: mapping ${listings.length} listing(s) (no WooCommerce writes)`
      : `Importing ${listings.length} listing(s) as ${process.env.WC_DEFAULT_STATUS ?? "draft"}…`
  );

  for (const listing of listings) {
    const taxonomyKey = String(listing.taxonomy_id);
    const mappedTaxonomy = categoryMap[taxonomyKey];
    let categorySlug =
      listing.wc_category_slug ??
      resolveCategorySlug(listing, categoryRules) ??
      mappedTaxonomy?.wc_slug;

    if (categorySlug) {
      listing.wc_category_slug = categorySlug;
    }

    let categoryId: number | null = null;

    if (categorySlug && woo) {
      const cacheKey = categorySlug;
      if (categoryCache.has(cacheKey)) {
        categoryId = categoryCache.get(cacheKey)!;
      } else {
        const name =
          mappedTaxonomy?.wc_name ??
          categoryNameForSlug(categorySlug, categoryRules);
        const cat = await woo.ensureCategory(name, categorySlug);
        categoryCache.set(cacheKey, cat.id);
        categoryId = cat.id;
      }
    }

    const existing = woo ? await woo.findProductByEtsyListingId(listing.listing_id) : null;
    const mappedListing = mapListingToWoo(
      listing,
      categoryId,
      categoryMap,
      existing?.slug
    );

    if (woo) {
      if (existing) {
        // Re-import: keep WooCommerce slug for this Etsy listing only.
      } else {
        mappedListing.payload.slug = await resolveUniqueSlug(
          woo,
          mappedListing.payload.slug,
          listing.listing_id
        );
      }
    }

    const warnings = [...mappedListing.warnings];
    const errors: string[] = [];
    let action: "create" | "update" | "skip" | "dry-run" = dryRun ? "dry-run" : "create";
    let wcProductId: number | "" = "";
    let wcSlug = mappedListing.payload.slug;

    try {
      if (dryRun) {
        const verb = existing ? "update" : "create";
        console.log(
          `[dry-run] ${verb} ${listing.listing_id} "${listing.title}" → ${mappedListing.payload.type} slug=${mappedListing.payload.slug} (${warnings.length} warning(s))`
        );
      } else if (existing) {
        action = "update";
        const updated = await woo!.updateProduct(existing.id, mappedListing.payload);
        wcProductId = updated.id;
        wcSlug = updated.slug;
        console.log(`Updated WC #${updated.id}: ${listing.title}`);
      } else {
        const created = await woo!.createProduct(mappedListing.payload);
        wcProductId = created.id;
        wcSlug = created.slug;
        console.log(`Created WC #${created.id}: ${listing.title}`);
      }
    } catch (err) {
      action = "skip";
      errors.push(err instanceof Error ? err.message : String(err));
      console.error(`Failed ${listing.listing_id} "${listing.title}":`, err);
    }

    reporter.add({
      etsy_listing_id: listing.listing_id,
      etsy_title: listing.title,
      wc_product_id: wcProductId,
      wc_slug: wcSlug,
      action,
      status: errors.length ? "error" : warnings.length ? "warning" : "ok",
      warnings: warnings.join("; "),
      errors: errors.join("; "),
    });
  }

  reporter.write();
  reporter.summary();
}

const isMain =
  !!process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runImport().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
