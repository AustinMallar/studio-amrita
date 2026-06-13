import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PATHS } from "./config.js";
import { runImport } from "./import.js";
import {
  listingsToSnapshot,
  logCsvHeaders,
  parseEtsyListingsCsv,
} from "./parse-etsy-csv.js";
import { summarizeTaxonomies } from "./map-listing.js";
import { resolveCategorySlug, loadCategoryRules } from "./category-rules.js";

function parseArgs(): { csvPath: string; skipImport: boolean } {
  const args = process.argv.slice(2);
  let csvPath = "";
  let skipImport = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--no-import") skipImport = true;
    else if (!args[i].startsWith("-") && !csvPath) csvPath = args[i];
  }
  if (!csvPath) {
    throw new Error(
      "Usage: npm run import-from-csv -- <path-to-etsy-listings.csv> [--no-import] [--dry-run]\n\n" +
        "Download CSV from Etsy: Shop Manager → Settings → Options → Download Data → Currently for Sale Listings"
    );
  }
  return { csvPath: resolve(csvPath), skipImport };
}

async function main(): Promise<void> {
  const { csvPath, skipImport } = parseArgs();
  const dryRun = process.argv.includes("--dry-run");

  console.log(`Reading Etsy CSV: ${csvPath}`);
  const csvText = readFileSync(csvPath, "utf8");
  logCsvHeaders(csvText);

  const listings = parseEtsyListingsCsv(csvText);
  if (!listings.length) {
    throw new Error("No listings parsed from CSV. Check file format and TITLE column.");
  }

  const rules = loadCategoryRules();
  let categorized = 0;
  for (const listing of listings) {
    const csvOverride = listing.wc_category_slug;
    listing.wc_category_slug =
      csvOverride ?? resolveCategorySlug(listing, rules) ?? undefined;
    if (listing.wc_category_slug) categorized++;
  }

  const snapshot = listingsToSnapshot(listings, `csv:${csvPath}`);
  writeFileSync(PATHS.exportFile, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Wrote ${listings.length} listing(s) → ${PATHS.exportFile}`);
  console.log(`Category rules matched ${categorized} listing(s)`);

  const taxonomies = summarizeTaxonomies(listings);
  if (Object.keys(taxonomies).length) {
    console.log("\nTaxonomy IDs (CSV imports usually have none):", taxonomies);
  }

  const uncategorized = listings.filter((l) => !l.wc_category_slug);
  if (uncategorized.length) {
    console.log(
      `\n${uncategorized.length} listing(s) without category — edit category-rules.json or add WC_CATEGORY_SLUG column in CSV:`
    );
    for (const l of uncategorized.slice(0, 10)) {
      console.log(`  - ${l.title}`);
    }
  }

  if (skipImport) {
    console.log("\nSkipping WooCommerce import (--no-import). Run: npm run import");
    return;
  }

  const importArgv = dryRun ? ["--dry-run"] : [];
  await runImport(importArgv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
