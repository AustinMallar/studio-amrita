import { writeFileSync } from "node:fs";
import { PATHS } from "./config.js";
import { EtsyClient } from "./etsy-client.js";
import { summarizeTaxonomies } from "./map-listing.js";
import type { EtsyExportSnapshot, EtsyListing } from "./types.js";

function parseArgs(): { listingId?: number } {
  const args = process.argv.slice(2);
  let listingId: number | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--listing-id" && args[i + 1]) {
      listingId = Number(args[i + 1]);
      i++;
    }
  }
  return { listingId };
}

async function main(): Promise<void> {
  const { listingId } = parseArgs();
  const client = new EtsyClient();
  const shopId = await client.getShopId();
  console.log(`Etsy shop_id: ${shopId}`);

  let listings = await client.fetchActiveListings(shopId);
  if (listingId) {
    listings = listings.filter((l) => l.listing_id === listingId);
    if (!listings.length) {
      throw new Error(`Active listing ${listingId} not found in shop ${shopId}`);
    }
  }
  console.log(`Fetched ${listings.length} active listing(s)`);

  const listingIds = listings.map((l) => l.listing_id);
  console.log("Fetching images (batch)…");
  const imageMap = await client.fetchListingImages(listingIds);

  console.log("Fetching inventory (per listing)…");
  const inventoryMap = await client.fetchAllInventory(listingIds, 3);

  const enriched: EtsyListing[] = listings.map((listing) => ({
    ...listing,
    images: imageMap.get(listing.listing_id) ?? [],
    inventory: inventoryMap.get(listing.listing_id),
  }));

  const currency =
    enriched[0]?.price?.currency_code ??
    enriched[0]?.inventory?.products?.[0]?.offerings?.[0]?.price?.currency_code ??
    "CAD";

  const snapshot: EtsyExportSnapshot = {
    exported_at: new Date().toISOString(),
    shop_id: shopId,
    currency_code: currency,
    listings: enriched,
  };

  writeFileSync(PATHS.exportFile, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Wrote export: ${PATHS.exportFile}`);

  const taxonomies = summarizeTaxonomies(enriched);
  console.log("\nEtsy taxonomy_id counts (add these to category-map.json):");
  for (const [id, count] of Object.entries(taxonomies).sort()) {
    console.log(`  ${id}: ${count} listing(s)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
