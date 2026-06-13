import { getHomepageCollections } from "@/lib/api";
import { FooterValues } from "@/components/FooterValues";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { PromoBar } from "@/components/PromoBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl } from "@/lib/site";
import { PRODUCT_NAMES } from "@/lib/product-names";
import { collectionPageSchemas } from "@/lib/schema";
import { toUiProducts } from "@/lib/ui-products";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const SHOP_DESCRIPTION = `Shop handmade crochet ${PRODUCT_NAMES.glowBears} and gift bundles from Studio Amrita.`;

export const metadata: Metadata = {
  title: "Shop | Studio Amrita",
  description: SHOP_DESCRIPTION,
};

type HomepageRow = Awaited<ReturnType<typeof getHomepageCollections>>["rows"][number];

function collectionImage(row: HomepageRow): { url: string | null; alt: string } {
  const data = row.data;
  const name = row.data?.name ?? row.categoryName;

  if (data?.lifestyleImageUrl) {
    return {
      url: data.lifestyleImageUrl,
      alt: data.lifestyleImageAlt?.trim() || name,
    };
  }

  const first = data?.products?.[0];
  if (first?.imageUrl) {
    return {
      url: first.imageUrl,
      alt: first.imageAlt?.trim() || name,
    };
  }

  return { url: null, alt: name };
}

function CollectionHeroImage({ url, alt }: { url: string; alt: string }) {
  const isLocal = url.startsWith("/");

  if (isLocal) {
    return (
      <Image
        src={url}
        alt={alt}
        width={1024}
        height={904}
        unoptimized
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes="(max-width: 1152px) 100vw, 1152px"
      quality={90}
      className="object-cover transition duration-300 group-hover:scale-[1.02]"
    />
  );
}

function CollectionCard({ row }: { row: HomepageRow }) {
  const name = row.data?.name ?? row.categoryName;
  const description =
    row.data?.description && row.data.description.length > 0
      ? row.data.description
      : row.fallbackDescription;
  const { url, alt } = collectionImage(row);
  const previewProducts = toUiProducts(row.data?.products ?? []).slice(0, 4);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white/50">
      <Link
        href={row.shopHref}
        className="group block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-blush/35">
          {url ? (
            <CollectionHeroImage url={url} alt={alt} />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center font-sans text-sm uppercase tracking-wide text-body">
              {name}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <div>
          <h2 className="font-heading text-2xl text-heading">{name}</h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-body">{description}</p>
        </div>

        {previewProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previewProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        <Link
          href={row.shopHref}
          className="mt-auto inline-flex w-fit items-center font-sans text-sm font-semibold uppercase tracking-wide text-dusty-rose hover:underline"
        >
          {row.shopLabel}
        </Link>
      </div>
    </article>
  );
}

export default async function ShopPage() {
  const { rows } = await getHomepageCollections();
  const seen = new Set<string>();
  const productItems = rows.flatMap((row) =>
    toUiProducts(row.data?.products ?? [])
      .filter((product) => product.slug && !seen.has(product.slug))
      .map((product) => {
        seen.add(product.slug!);
        return {
          name: product.name,
          url: absoluteUrl(`/products/${product.slug}`),
          image: product.imageUrl || undefined,
        };
      })
  );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <JsonLd
        data={collectionPageSchemas({
          path: "/shop",
          name: "Shop | Studio Amrita",
          description: SHOP_DESCRIPTION,
          products: productItems,
        })}
      />
      <PromoBar />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-black/[0.04] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal>
              <nav className="font-sans text-sm text-body">
                <Link href="/" className="text-dusty-rose hover:underline">
                  ← Back to home
                </Link>
              </nav>
            </ScrollReveal>

            <ScrollReveal className="mt-10 max-w-2xl" delayMs={40}>
              <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
                OUR COLLECTIONS ♡
              </p>
              <h1 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">Shop</h1>
              <p className="mt-4 font-sans text-base leading-relaxed text-body">
                Handmade crochet {PRODUCT_NAMES.glowBears} and bundles, each paired with curated skincare minis
                and gift-ready packaging.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:gap-16">
            {rows.map((row, i) => (
              <ScrollReveal key={row.key} delayMs={i * 50}>
                <CollectionCard row={row} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      </main>
      <FooterValues />
    </div>
  );
}
