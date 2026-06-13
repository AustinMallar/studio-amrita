import type {
  EtsyExportSnapshot,
  EtsyImage,
  EtsyInventory,
  EtsyInventoryProduct,
  EtsyListing,
  EtsyOffering,
} from "./types.js";
import { normalizeHeader, parseCsv, pick, splitList, type CsvRow } from "./csv-parse.js";
import { WC_DEFAULT_VARIATION_STOCK } from "./config.js";
import {
  extractListingIdFromUrl,
  normalizeAttributeName,
  stableListingId,
} from "./utils.js";

type RawCsvRow = CsvRow & { _rowIndex: number };

function parsePrice(value: string): { amount: number; divisor: number } | null {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return { amount: Math.round(num * 100), divisor: 100 };
}

function parseImages(row: CsvRow): EtsyImage[] {
  const urls: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const url = pick(row, `image${i}`, `image_${i}`);
    if (url) urls.push(url);
  }
  const combined = pick(row, "image_urls", "images");
  if (combined) urls.push(...splitList(combined));
  const seen = new Set<string>();
  return urls
    .filter((url) => {
      if (!url.startsWith("http") || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .map((url, index) => ({
      listing_image_id: index + 1,
      rank: index + 1,
      url_fullxfull: url,
      alt_text: null,
    }));
}

function listingIdForRow(row: CsvRow, title: string): number {
  const explicit = pick(row, "listing_id", "listingid", "id");
  if (explicit && /^\d+$/.test(explicit)) return Number(explicit);
  const url = pick(row, "url", "listing_url");
  const fromUrl = url ? extractListingIdFromUrl(url) : null;
  if (fromUrl) return fromUrl;
  return stableListingId(title.toLowerCase());
}

function groupKey(row: CsvRow, title: string): string {
  const id = pick(row, "listing_id", "listingid");
  if (id) return `id:${id}`;
  const url = pick(row, "url", "listing_url");
  const fromUrl = url ? extractListingIdFromUrl(url) : null;
  if (fromUrl) return `id:${fromUrl}`;
  return `title:${title.toLowerCase()}`;
}

function readVariationColumns(row: CsvRow): Array<{ name: string; values: string[] }> {
  const attrs: Array<{ name: string; values: string[] }> = [];

  for (let n = 1; n <= 2; n++) {
    const name = pick(
      row,
      `variation_${n}_name`,
      `variation_name_${n}`,
      `variation_${n}_type`,
      `variation_type_${n}`,
      `option${n}_name`
    );
    const valuesRaw = pick(
      row,
      `variation_${n}_values`,
      `variation_values_${n}`,
      `variation_value_${n}`,
      `option${n}_value`,
      `option${n}_values`
    );
    const values = splitList(valuesRaw);
    if (name && values.length) {
      attrs.push({ name: normalizeAttributeName(name), values });
    }
  }

  const variationsBlob = pick(row, "variations");
  if (variationsBlob && !attrs.length) {
    for (const part of variationsBlob.split(";")) {
      const [namePart, valuesPart] = part.split(":").map((s) => s.trim());
      if (!namePart || !valuesPart) continue;
      const values = splitList(valuesPart);
      if (values.length) {
        attrs.push({ name: normalizeAttributeName(namePart), values });
      }
    }
  }

  return attrs;
}

function offeringFromRow(
  row: CsvRow,
  currency: string
): EtsyOffering | null {
  const priceStr = pick(row, "price");
  const price = priceStr ? parsePrice(priceStr) : null;
  if (!price) return null;
  const qty = Number(pick(row, "quantity", "qty") || "0");
  return {
    offering_id: 1,
    price: {
      amount: price.amount,
      divisor: price.divisor,
      currency_code: currency || "CAD",
    },
    quantity: Number.isFinite(qty) ? qty : 0,
    is_enabled: true,
  };
}

function inventoryFromVariationRows(
  rows: RawCsvRow[],
  currency: string,
  listingId: number
): EtsyInventory {
  const products: EtsyInventoryProduct[] = rows.map((row, index) => {
    const optionValue = pick(
      row,
      "variation_value",
      "option_value",
      "color",
      "colour"
    );
    const optionName = pick(row, "variation_name", "option_name") || "Color";
    const attrs = readVariationColumns(row);

    let property_values: EtsyInventoryProduct["property_values"] = [];

    if (optionValue) {
      property_values = [
        {
          property_id: 0,
          property_name: normalizeAttributeName(optionName),
          values: [optionValue],
        },
      ];
    } else if (attrs.length) {
      property_values = attrs
        .filter((a) => a.values[0])
        .map((a) => ({
          property_id: 0,
          property_name: a.name,
          values: [a.values[0]],
        }));
    }

    const offering = offeringFromRow(row, currency);
    return {
      product_id: listingId * 1000 + index + 1,
      sku: pick(row, "sku"),
      property_values,
      offerings: offering ? [offering] : [],
    };
  });

  return { products };
}

function expandVariationColumnsToProducts(
  row: CsvRow,
  currency: string,
  listingId: number
): EtsyInventoryProduct[] {
  const attrs = readVariationColumns(row);
  if (!attrs.length) return [];

  const offering = offeringFromRow(row, currency);
  if (!offering) return [];

  const combos: Array<Record<string, string>> = [{}];
  for (const attr of attrs) {
    const next: Array<Record<string, string>> = [];
    for (const combo of combos) {
      for (const value of attr.values) {
        next.push({ ...combo, [attr.name]: value });
      }
    }
    combos.length = 0;
    combos.push(...next);
  }

  const qty = Number(pick(row, "quantity", "qty") || "0");
  const perVariantQty =
    combos.length > 1
      ? Math.max(0, Math.floor(qty / combos.length))
      : qty;
  const stockEach =
    perVariantQty > 0 ? perVariantQty : WC_DEFAULT_VARIATION_STOCK;

  return combos.map((combo, index) => ({
    product_id: listingId * 1000 + index + 1,
    sku: pick(row, "sku") || undefined,
    property_values: Object.entries(combo).map(([name, value]) => ({
      property_id: 0,
      property_name: name,
      values: [value],
    })),
    offerings: [
      {
        ...offering,
        quantity: stockEach,
      },
    ],
  }));
}

function rowToPartialListing(row: RawCsvRow): EtsyListing {
  const title = pick(row, "title", "name");
  if (!title) {
    throw new Error(`CSV row ${row._rowIndex}: missing TITLE`);
  }

  const currency = pick(row, "currency_code", "currency") || "CAD";
  const price = parsePrice(pick(row, "price"));
  const listing_id = listingIdForRow(row, title);
  const tags = splitList(pick(row, "tags"));
  const materials = splitList(pick(row, "materials"));
  const wc_category_slug = pick(row, "wc_category_slug", "category_slug") || undefined;
  const url = pick(row, "url", "listing_url") || undefined;

  return {
    listing_id,
    title,
    description: pick(row, "description"),
    state: "active",
    taxonomy_id: 0,
    url,
    tags,
    materials,
    wc_category_slug,
    price: price
      ? { amount: price.amount, divisor: price.divisor, currency_code: currency }
      : undefined,
    quantity: Number(pick(row, "quantity", "qty") || "0") || 0,
    images: parseImages(row),
  };
}

function buildListingFromGroup(key: string, rows: RawCsvRow[]): EtsyListing {
  const base = rowToPartialListing(rows[0]);
  const currency =
    pick(rows[0], "currency_code", "currency") ||
    base.price?.currency_code ||
    "CAD";

  let inventory: EtsyInventory;

  if (rows.length > 1) {
    inventory = inventoryFromVariationRows(rows, currency, base.listing_id);
  } else {
    const expanded = expandVariationColumnsToProducts(rows[0], currency, base.listing_id);
    if (expanded.length > 1) {
      inventory = { products: expanded };
    } else if (expanded.length === 1) {
      inventory = { products: expanded };
    } else {
      const offering = offeringFromRow(rows[0], currency);
      inventory = {
        products: [
          {
            product_id: base.listing_id * 1000 + 1,
            sku: pick(rows[0], "sku"),
            property_values: [],
            offerings: offering ? [offering] : [],
          },
        ],
      };
    }
  }

  return {
    ...base,
    inventory,
    _csv_source_rows: rows.length,
  };
}

export function parseEtsyListingsCsv(csvText: string): EtsyListing[] {
  const rows = parseCsv(csvText).map((row, index) => ({
    ...row,
    _rowIndex: index + 2,
  })) as RawCsvRow[];

  if (!rows.length) return [];

  const groups = new Map<string, RawCsvRow[]>();
  for (const row of rows) {
    const title = pick(row, "title", "name");
    if (!title) continue;
    const key = groupKey(row, title);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return [...groups.values()].map((groupRows) =>
    buildListingFromGroup("", groupRows)
  );
}

export function listingsToSnapshot(
  listings: EtsyListing[],
  source: string
): EtsyExportSnapshot {
  const currency =
    listings[0]?.price?.currency_code ??
    listings[0]?.inventory?.products?.[0]?.offerings?.[0]?.price?.currency_code ??
    "CAD";

  return {
    exported_at: new Date().toISOString(),
    shop_id: 0,
    currency_code: currency,
    listings,
    ...(source ? { source } : {}),
  } as EtsyExportSnapshot & { source?: string };
}

/** Log CSV headers to help debug unexpected Etsy export formats. */
export function logCsvHeaders(csvText: string): void {
  const firstLine = csvText.split(/\r?\n/)[0] ?? "";
  const headers = firstLine
    .split(",")
    .map((h) => normalizeHeader(h.replace(/^\uFEFF/, "")));
  console.log("CSV columns:", headers.join(", "));
}
