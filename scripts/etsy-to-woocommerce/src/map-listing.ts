import { WC_CURRENCY, WC_DEFAULT_STATUS, WC_DEFAULT_VARIATION_STOCK } from "./config.js";
import {
  etsyPriceToString,
  hasMeaningfulVariations,
  normalizeAttributeName,
  normalizeDescription,
  parentSku,
  slugify,
  variationSku,
} from "./utils.js";
import type {
  CategoryMap,
  EtsyImage,
  EtsyInventory,
  EtsyInventoryProduct,
  EtsyListing,
  MappedListing,
  WooAttributePayload,
  WooImagePayload,
  WooProductPayload,
  WooVariationPayload,
} from "./types.js";

function bestImageUrl(img: EtsyImage): string | null {
  return img.url_fullxfull ?? img.url_570xN ?? null;
}

function mapImages(listing: EtsyListing): WooImagePayload[] {
  const images = listing.images ?? [];
  const mapped: WooImagePayload[] = [];
  for (const [index, img] of images.entries()) {
    const src = bestImageUrl(img);
    if (!src) continue;
    mapped.push({
      src,
      name: listing.title,
      alt: img.alt_text?.trim() || listing.title,
      position: img.rank ?? index + 1,
    });
  }
  return mapped.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function pickOfferingPrice(
  listing: EtsyListing,
  product: EtsyInventoryProduct
): { amount: number; divisor: number; currency: string } | null {
  const offering = product?.offerings?.find((o) => o.is_enabled) ?? product?.offerings?.[0];
  if (offering?.price) {
    return {
      amount: offering.price.amount,
      divisor: offering.price.divisor,
      currency: offering.price.currency_code,
    };
  }
  if (listing.price) {
    return {
      amount: listing.price.amount,
      divisor: listing.price.divisor,
      currency: listing.price.currency_code,
    };
  }
  return null;
}

function buildAttributeOptions(
  products: EtsyInventoryProduct[],
  propertyName: string
): string[] {
  const options = new Set<string>();
  for (const product of products) {
    for (const pv of product.property_values) {
      const name = normalizeAttributeName(pv.property_name ?? "");
      if (name !== propertyName) continue;
      for (const value of pv.values) {
        if (value.trim()) options.add(value.trim());
      }
    }
  }
  return [...options];
}

function variationAttributes(
  product: EtsyInventoryProduct
): Array<{ name: string; option: string }> {
  return product.property_values
    .flatMap((pv) => {
      const name = normalizeAttributeName(pv.property_name ?? "Option");
      const value = pv.values.find((v) => v.trim())?.trim();
      if (!value) return [];
      return [{ name, option: value }];
    });
}

function variationStockQuantity(
  offeringQty: number | undefined,
  listingQty: number | undefined
): number {
  if (typeof offeringQty === "number" && offeringQty > 0) return offeringQty;
  if (typeof listingQty === "number" && listingQty > 0) return listingQty;
  return WC_DEFAULT_VARIATION_STOCK;
}

export function mapListingToWoo(
  listing: EtsyListing,
  categoryId: number | null,
  categoryMap: CategoryMap,
  existingSlug?: string
): MappedListing {
  const warnings: string[] = [];
  const taxonomyKey = String(listing.taxonomy_id);
  const mapped = categoryMap[taxonomyKey];

  if (listing.taxonomy_id && !mapped) {
    warnings.push(
      `Unmapped Etsy taxonomy_id ${taxonomyKey}; assign in category-map.json`
    );
  }
  if (!categoryId) {
    warnings.push(
      "No WooCommerce category assigned; set WC_CATEGORY_SLUG in CSV or edit category-rules.json"
    );
  }

  const inventory = listing.inventory;
  const products = inventory?.products ?? [];
  const isVariable = hasMeaningfulVariations(products);
  const images = mapImages(listing);

  if (!images.length) {
    warnings.push("No listing images found");
  }

  let slug = existingSlug ?? slugify(listing.title);
  if (!slug) {
    slug = `etsy-${listing.listing_id}`;
    warnings.push("Generated fallback slug from listing_id");
  }

  const description = normalizeDescription(listing.description);
  const materials = listing.materials?.filter(Boolean) ?? [];
  if (materials.length) {
    warnings.push(`Materials stored in meta only: ${materials.join(", ")}`);
  }

  const meta_data: WooProductPayload["meta_data"] = [
    { key: "_etsy_listing_id", value: String(listing.listing_id) },
  ];
  if (listing.url) {
    meta_data.push({ key: "_etsy_listing_url", value: listing.url });
  }
  if (materials.length) {
    meta_data.push({ key: "_etsy_materials", value: materials.join(", ") });
  }

  const categories = categoryId ? [{ id: categoryId }] : [];
  const tags = (listing.tags ?? []).map((name) => ({ name }));

  const payload: WooProductPayload = {
    name: listing.title,
    slug,
    type: isVariable ? "variable" : "simple",
    status: WC_DEFAULT_STATUS,
    description,
    categories,
    images,
    tags: tags.length ? tags : undefined,
    meta_data,
    sku: parentSku(listing.listing_id),
    manage_stock: true,
  };

  if (isVariable) {
    const attributeNames = new Set<string>();
    for (const product of products) {
      for (const pv of product.property_values) {
        const name = normalizeAttributeName(pv.property_name ?? "Option");
        if (pv.values.some((v) => v.trim())) attributeNames.add(name);
      }
    }

    const attributes: WooAttributePayload[] = [...attributeNames].map((name) => ({
      name,
      visible: true,
      variation: true,
      options: buildAttributeOptions(products, name),
    }));

    if (!attributes.length) {
      warnings.push("Variable listing has no attribute options; treating as simple");
      payload.type = "simple";
    } else {
      payload.attributes = attributes;
      payload.variations = [];
      payload.manage_stock = false;
      delete payload.stock_quantity;

      for (const product of products) {
        const offering = product.offerings?.find((o) => o.is_enabled) ?? product.offerings?.[0];
        if (!offering) {
          warnings.push(`Missing offering for Etsy product_id ${product.product_id}`);
          continue;
        }
        const price = pickOfferingPrice(listing, product);
        if (!price) {
          warnings.push(`Missing price for variation product_id ${product.product_id}`);
          continue;
        }
        if (price.currency !== WC_CURRENCY) {
          warnings.push(
            `Variation price currency ${price.currency} differs from WC_CURRENCY ${WC_CURRENCY}`
          );
        }

        const sku = variationSku(listing.listing_id, product.product_id, product.sku);
        if (!product.sku?.trim()) {
          warnings.push(`Generated SKU for variation: ${sku}`);
        }

        const variation: WooVariationPayload = {
          regular_price: etsyPriceToString(price.amount, price.divisor),
          sku,
          stock_quantity: variationStockQuantity(
            offering.quantity,
            listing.quantity
          ),
          manage_stock: true,
          attributes: variationAttributes(product),
        };
        payload.variations!.push(variation);
      }

      if (!payload.variations?.length) {
        warnings.push("No valid variations; falling back to simple product");
        payload.type = "simple";
        delete payload.attributes;
        delete payload.variations;
      }
    }
  }

  if (!isVariable || payload.type === "simple") {
    const product = products[0];
    const offering = product?.offerings?.find((o) => o.is_enabled) ?? product?.offerings?.[0];
    const price = product
      ? pickOfferingPrice(listing, product)
      : listing.price
        ? {
            amount: listing.price.amount,
            divisor: listing.price.divisor,
            currency: listing.price.currency_code,
          }
        : null;

    if (!price) {
      warnings.push("Missing price on simple listing");
    } else {
      if (price.currency !== WC_CURRENCY) {
        warnings.push(
          `Price currency ${price.currency} differs from WC_CURRENCY ${WC_CURRENCY}`
        );
      }
      payload.regular_price = etsyPriceToString(price.amount, price.divisor);
    }

    const qty = offering?.quantity ?? listing.quantity ?? 0;
    payload.stock_quantity = qty;
    if (product?.sku?.trim()) {
      payload.sku = product.sku.trim();
    } else {
      payload.sku = parentSku(listing.listing_id);
      warnings.push(`Generated parent SKU: ${payload.sku}`);
    }
  }

  return {
    listing_id: listing.listing_id,
    payload,
    warnings,
    is_variable: payload.type === "variable",
  };
}

/** Log taxonomy IDs seen during export to help fill category-map.json */
export function summarizeTaxonomies(listings: EtsyListing[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const listing of listings) {
    const key = String(listing.taxonomy_id);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
