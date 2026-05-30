import {
  CATEGORY_SLUGS,
  getProductCategoryCollection,
  isShopCollectionSlugVisible,
  visibleShopCollectionSlugs,
} from "@/lib/api";
import { FooterValues } from "@/components/FooterValues";
import { ProductCard } from "@/components/ProductCard";
import { toUiProducts } from "@/lib/ui-products";
import { PromoBar } from "@/components/PromoBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const FALLBACK_DESCRIPTION: Record<string, string> = {
  [CATEGORY_SLUGS["Essential Glow Bear"]]:
    "Four collectible bears paired with glow minis — mix, match, and gift the full set.",
  [CATEGORY_SLUGS["Glow Bow Charms"]]:
    "Petite bows to clip, gift, or collect — tiny accents with big personality.",
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.values(CATEGORY_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = await getProductCategoryCollection(slug);
  if (!collection?.name) {
    return { title: "Shop | Studio Amrita" };
  }
  return {
    title: `${collection.name} | Studio Amrita`,
    description:
      collection.description ||
      FALLBACK_DESCRIPTION[slug] ||
      `Shop ${collection.name} at Studio Amrita.`,
  };
}

export default async function ShopCollectionPage(props: Props) {
  const { slug } = await props.params;

  if (!isShopCollectionSlugVisible(slug)) {
    notFound();
  }

  const collection = await getProductCategoryCollection(slug);

  if (!collection) {
    notFound();
  }

  const description =
    collection.description && collection.description.length > 0
      ? collection.description
      : FALLBACK_DESCRIPTION[slug] ?? "";

  const products = toUiProducts(collection.products ?? []);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-black/[0.04] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <nav className="mb-8 font-sans text-sm text-body">
              <Link
                href="/"
                className="font-semibold text-dusty-rose underline-offset-4 hover:underline"
              >
                Home
              </Link>
              <span className="mx-2 text-black/30" aria-hidden>
                /
              </span>
              <span className="text-heading">{collection.name}</span>
            </nav>
            <h1 className="text-3xl text-heading sm:text-4xl">{collection.name}</h1>
            {description ? (
              <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-body">
                {description}
              </p>
            ) : null}
            {collection.minPriceFormatted ? (
              <p className="mt-4 font-sans text-lg font-semibold text-heading">
                From {collection.minPriceFormatted}
              </p>
            ) : null}
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-6xl">
            {products.length === 0 ? (
              <p className="font-sans text-body">No products in this collection yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {products.map((p, i) => (
                  <ScrollReveal key={p.id} className="min-w-0" delayMs={36 + i * 56}>
                    <ProductCard product={p} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <FooterValues />
    </div>
  );
}
