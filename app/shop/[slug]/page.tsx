import {
  categoryFallbackDescription,
  getProductCategoryCollection,
  getShopCategorySlugs,
  isShopCollectionSlugVisible,
} from "@/lib/api";
import { FooterValues } from "@/components/FooterValues";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { toUiProducts } from "@/lib/ui-products";
import { PromoBar } from "@/components/PromoBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl } from "@/lib/site";
import { collectionPageSchemas } from "@/lib/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getShopCategorySlugs();
  return slugs.map((slug) => ({ slug }));
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
      categoryFallbackDescription(slug) ||
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
      : categoryFallbackDescription(slug);

  const products = toUiProducts(collection.products ?? []);
  const productItems = products
    .filter((product) => product.slug)
    .map((product) => ({
      name: product.name,
      url: absoluteUrl(`/products/${product.slug}`),
      image: product.imageUrl || undefined,
    }));

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <JsonLd
        data={collectionPageSchemas({
          path: `/shop/${slug}`,
          name: collection.name,
          description: description || undefined,
          products: productItems,
        })}
      />
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
