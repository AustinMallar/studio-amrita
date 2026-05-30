import { getHomepageCollections } from "@/lib/api";
import { InstagramFeedSection } from "@/components/InstagramFeedSection";
import { BrandStorySection } from "@/components/BrandStorySection";
import { CollectionsIntro } from "@/components/CollectionsIntro";
import { FooterValues } from "@/components/FooterValues";
import { HeroSection } from "@/components/HeroSection";
import { ProductRow } from "@/components/ProductRow";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import type { RawCatalogProduct } from "@/lib/ui-products";
import { toUiProducts } from "@/lib/ui-products";

type LayoutType = "grid" | "lifestyle";

type HomepageRowConfig = {
  key: string;
  categoryName: string;
  layoutType: LayoutType;
  shopHref: string;
  shopLabel: string;
  displayPrice: string;
  fallbackDescription: string;
  data: {
    name?: string;
    description?: string;
    slug?: string;
    lifestyleImageUrl?: string | null;
    lifestyleImageAlt?: string;
    /** Classic Glow Bear variable product — colour attribute options. */
    swatches?: string[];
    products: RawCatalogProduct[];
  } | null;
};

export default async function Home() {
  const { rows } = (await getHomepageCollections()) as { rows: HomepageRowConfig[] };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CollectionsIntro />
        {rows.map((row) => {
          const description =
            row.data?.description && row.data.description.length > 0
              ? row.data.description
              : row.fallbackDescription;
          const products = toUiProducts(row.data?.products ?? []);
          return (
            <ProductRow
              key={row.key}
              categoryName={row.data?.name ?? row.categoryName}
              layoutType={row.layoutType}
              description={description}
              priceLabel={row.displayPrice}
              shopHref={row.shopHref}
              shopLabel={row.shopLabel}
              products={products}
              lifestyleImageUrl={row.data?.lifestyleImageUrl}
              lifestyleImageAlt={row.data?.lifestyleImageAlt}
              lifestyleColorSwatches={row.key === "classic" ? row.data?.swatches : undefined}
            />
          );
        })}
        <InstagramFeedSection />
        <BrandStorySection />
      </main>
      <FooterValues />
    </div>
  );
}
