import type { HoverMediaKind, UiProduct } from "@/components/ProductCard";

/** Shape returned by `mapProductNode` / homepage category blocks. */
export type RawCatalogProduct = {
  id: string;
  slug?: string;
  name: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  swatches: string[];
  hoverMediaUrl?: string;
  hoverMediaAlt?: string;
  hoverMediaKind?: HoverMediaKind;
};

export function toUiProducts(list: RawCatalogProduct[]): UiProduct[] {
  return list.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    swatches: p.swatches,
    ...(p.hoverMediaUrl && p.hoverMediaKind
      ? {
          hoverMediaUrl: p.hoverMediaUrl,
          hoverMediaAlt: p.hoverMediaAlt ?? "",
          hoverMediaKind: p.hoverMediaKind,
        }
      : {}),
  }));
}
