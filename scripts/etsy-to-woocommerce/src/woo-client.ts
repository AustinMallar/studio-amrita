import { requireEnv, WC_DEFAULT_STATUS } from "./config.js";
import { withRetry } from "./utils.js";
import type { WooProductPayload, WooVariationPayload } from "./types.js";

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
};

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku?: string;
  meta_data?: Array<{ key: string; value: string | number }>;
};

export function etsyListingSku(listingId: number): string {
  return `etsy-listing-${listingId}`;
}

export function productHasEtsyListingId(
  product: WooProduct,
  listingId: number
): boolean {
  const expected = String(listingId);
  const meta = product.meta_data?.find((m) => m.key === "_etsy_listing_id");
  if (meta != null && String(meta.value) === expected) return true;
  return product.sku === etsyListingSku(listingId);
}

export class WooClient {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const url = requireEnv("WOOCOMMERCE_URL").replace(/\/$/, "");
    const key = requireEnv("WC_CONSUMER_KEY");
    const secret = requireEnv("WC_CONSUMER_SECRET");
    this.baseUrl = `${url}/wp-json/wc/v3`;
    this.authHeader = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
    }
    return withRetry(async () => {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { message: text };
      }
      if (!res.ok) {
        const msg =
          (json as { message?: string })?.message ??
          (json as { code?: string })?.code ??
          text;
        const err = new Error(`WooCommerce API ${res.status} ${path}: ${msg}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }
      return json as T;
    });
  }

  async findCategoryBySlug(slug: string): Promise<WooCategory | null> {
    const data = await this.request<WooCategory[]>("GET", "/products/categories", undefined, {
      slug,
      per_page: "1",
    });
    return data[0] ?? null;
  }

  async ensureCategory(name: string, slug: string): Promise<WooCategory> {
    const existing = await this.findCategoryBySlug(slug);
    if (existing) return existing;
    return this.request<WooCategory>("POST", "/products/categories", { name, slug });
  }

  async findProductByEtsyListingId(listingId: number): Promise<WooProduct | null> {
    const expectedSku = etsyListingSku(listingId);

    // Exact SKU match (products created by a previous import run).
    const bySku = await this.request<WooProduct[]>("GET", "/products", undefined, {
      sku: expectedSku,
      per_page: "20",
    });
    const skuMatch = bySku.find((p) => p.sku === expectedSku);
    if (skuMatch && productHasEtsyListingId(skuMatch, listingId)) {
      return skuMatch;
    }

    // WooCommerce often ignores meta_value on GET /products — verify client-side.
    const byMetaKey = await this.request<WooProduct[]>("GET", "/products", undefined, {
      meta_key: "_etsy_listing_id",
      per_page: "100",
    });
    for (const product of byMetaKey) {
      if (productHasEtsyListingId(product, listingId)) {
        return product;
      }
    }

    return null;
  }

  /** Slug exists on a product that is not this Etsy listing (do not overwrite). */
  async slugOwnedByOtherListing(
    slug: string,
    listingId: number
  ): Promise<WooProduct | null> {
    const hit = await this.findProductBySlug(slug);
    if (!hit) return null;
    if (productHasEtsyListingId(hit, listingId)) return null;
    return hit;
  }

  async findProductBySlug(slug: string): Promise<WooProduct | null> {
    const data = await this.request<WooProduct[]>("GET", "/products", undefined, {
      slug,
      per_page: "1",
    });
    return data[0] ?? null;
  }

  async createProduct(payload: WooProductPayload): Promise<WooProduct> {
    const { variations, ...parent } = payload;
    const created = await this.request<WooProduct>("POST", "/products", {
      ...parent,
      status: parent.status || WC_DEFAULT_STATUS,
    });
    if (variations?.length && created.id) {
      await this.syncVariations(created.id, variations);
    }
    return created;
  }

  async updateProduct(
    productId: number,
    payload: WooProductPayload
  ): Promise<WooProduct> {
    const { variations, ...parent } = payload;
    const updated = await this.request<WooProduct>("PUT", `/products/${productId}`, parent);
    if (variations?.length) {
      await this.syncVariations(productId, variations);
    }
    return updated;
  }

  async listVariations(productId: number): Promise<Array<{ id: number; sku: string }>> {
    const data = await this.request<Array<{ id: number; sku: string }>>(
      "GET",
      `/products/${productId}/variations`,
      undefined,
      { per_page: "100" }
    );
    return data;
  }

  async syncVariations(
    productId: number,
    variations: WooVariationPayload[]
  ): Promise<void> {
    const existing = await this.listVariations(productId);
    const bySku = new Map(existing.map((v) => [v.sku, v.id]));

    for (const variation of variations) {
      const existingId = bySku.get(variation.sku);
      if (existingId) {
        await this.request("PUT", `/products/${productId}/variations/${existingId}`, variation);
      } else {
        await this.request("POST", `/products/${productId}/variations`, variation);
      }
    }
  }
}
