import "server-only";

import { getHomepageCollections } from "./api.js";

import type { ShopMegaMenuTile } from "./shop-mega-menu-types";

export type { ShopMegaMenuTile };

/**
 * Storefront category rows from WooCommerce — includes category / product imagery for the mega menu.
 */
export async function getShopMegaMenuTiles(): Promise<ShopMegaMenuTile[]> {
  const { rows } = await getHomepageCollections();

  return rows.map((row: {
    categoryName: string;
    shopHref: string;
    data?: {
      lifestyleImageUrl?: string | null;
      lifestyleImageAlt?: string | null;
      products?: Array<{ imageUrl?: string; imageAlt?: string }>;
    } | null;
  }) => {
    const data = row.data;
    let imageUrl: string | null = null;
    let imageAlt = row.categoryName;

    if (data?.lifestyleImageUrl) {
      imageUrl = data.lifestyleImageUrl;
      imageAlt = data.lifestyleImageAlt?.trim() || row.categoryName;
    } else if (data?.products?.[0]?.imageUrl) {
      imageUrl = data.products[0].imageUrl || null;
      imageAlt = data.products[0].imageAlt?.trim() || row.categoryName;
    }

    return {
      label: row.categoryName,
      href: row.shopHref,
      imageUrl,
      imageAlt,
    };
  });
}
