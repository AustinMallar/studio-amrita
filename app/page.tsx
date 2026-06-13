import { getHomepageCollections } from "@/lib/api";
import { BerryBumpSection } from "@/components/BerryBumpSection";
import { InstagramFeedSection } from "@/components/InstagramFeedSection";
import { BrandStorySection } from "@/components/BrandStorySection";
import { CollectionsIntro } from "@/components/CollectionsIntro";
import { FooterValues } from "@/components/FooterValues";
import { HeroSection } from "@/components/HeroSection";
import { JsonLd } from "@/components/JsonLd";
import { ProductRow } from "@/components/ProductRow";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { collectionPageSchemas } from "@/lib/schema";
import { SHIPPING_COPY } from "@/lib/shipping";
import { absoluteUrl, SITE } from "@/lib/site";
import type { RawCatalogProduct } from "@/lib/ui-products";
import { toUiProducts } from "@/lib/ui-products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio Amrita | Crochet Bear Keychain & Handmade Glow Bears",
  description:
    `Shop Studio Amrita's handmade crochet bear keychains and Glow Bears — kawaii amigurumi gifts, thoughtfully crafted and gift-ready. ${SHIPPING_COPY.metaSuffix}`,
  openGraph: {
    title: "Studio Amrita | Crochet Bear Keychain & Handmade Glow Bears",
    description:
      "Handmade crochet bear keychains and Glow Bears from Studio Amrita. Kawaii amigurumi gifts, beautifully packaged and ready to give.",
    images: [
      {
        url: SITE.defaultOgImage,
        alt: "Studio Amrita Glow Bear crochet bear keychains in gift-ready packaging",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Amrita | Crochet Bear Keychain & Handmade Glow Bears",
    description:
      "Handmade crochet bear keychains and Glow Bears from Studio Amrita. Kawaii amigurumi gifts, beautifully packaged and ready to give.",
    images: [SITE.defaultOgImage],
  },
};

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

function homepageSchemaProducts(rows: HomepageRowConfig[]) {
  const seen = new Set<string>();
  const items: { name: string; url: string; image?: string }[] = [];

  for (const row of rows) {
    const rowSlug = row.data?.slug?.trim();
    const rowName = row.data?.name ?? row.categoryName;
    if (rowSlug && !seen.has(rowSlug)) {
      seen.add(rowSlug);
      items.push({
        name: rowName,
        url: absoluteUrl(`/products/${rowSlug}`),
        image: row.data?.lifestyleImageUrl ?? undefined,
      });
    }

    for (const product of row.data?.products ?? []) {
      const slug = product.slug?.trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      items.push({
        name: product.name,
        url: absoluteUrl(`/products/${slug}`),
        image: product.imageUrl || undefined,
      });
    }
  }

  return items;
}

export default async function Home() {
  const { rows } = (await getHomepageCollections()) as { rows: HomepageRowConfig[] };

  const productItems = homepageSchemaProducts(rows);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <JsonLd
        data={collectionPageSchemas({
          path: "/",
          name: "Studio Amrita | Handmade Glow Bears & Gifts",
          description: SITE.description,
          products: productItems,
          pageType: "WebPage",
          primaryImage: SITE.defaultOgImage,
        })}
      />
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
        <BerryBumpSection />
        <BrandStorySection />
      </main>
      <FooterValues />
    </div>
  );
}
