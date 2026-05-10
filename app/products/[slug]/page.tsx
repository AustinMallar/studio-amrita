import {
  CATEGORY_SLUGS,
  getGlowBearBundleSiblings,
  getProductBySlug,
  mapProductDetail,
} from "@/lib/api";
import { getFrontendHoverVideo } from "@/lib/product-hover-videos";
import type { ProductDetailView } from "@/types/product-detail";
import { AddToCartButton } from "@/components/AddToCartButton";
import { GlowBearBundleMoreColours } from "@/components/GlowBearBundleMoreColours";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VariableProductImagePicker } from "@/components/VariableProductImagePicker";
import { FooterValues } from "@/components/FooterValues";
import { ProductDetailVideo } from "@/components/ProductDetailVideo";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { optionToSwatchColor } from "@/lib/product-swatches";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const json = await getProductBySlug(slug);
  const data = json?.data as { product?: Record<string, unknown> } | null | undefined;
  const raw = data?.product;
  const product = mapProductDetail(raw) as ProductDetailView | null;
  if (!product || !product.slug) notFound();

  const bundleCatSlug = CATEGORY_SLUGS["Glow Bear Bundle"];
  const showBundleSiblings =
    Array.isArray(product.categorySlugs) && product.categorySlugs.includes(bundleCatSlug);
  const bundleSiblings = showBundleSiblings
    ? await getGlowBearBundleSiblings(product.slug)
    : [];

  const descriptionText = String(product.descriptionHtml ?? "")
    .replace(/<[^>]+>/g, "")
    .trim();

  const isVariableWithColours =
    product.variations.length > 0 && /variable/i.test(String(product.productType || ""));

  const detailClip = getFrontendHoverVideo(product.slug);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:gap-14 lg:py-14">
        <ScrollReveal rootMargin="0px 0px 18% 0px">
          <nav className="font-sans text-sm text-body">
            <Link href="/" className="text-dusty-rose hover:underline">
              ← Back to home
            </Link>
          </nav>
        </ScrollReveal>

        {isVariableWithColours ? (
          <VariableProductImagePicker
            productDatabaseId={product.databaseId}
            productName={product.name}
            fallbackImageUrl={product.imageUrl}
            fallbackImageAlt={product.imageAlt}
            fallbackPrice={product.priceLabel}
            variations={product.variations}
          >
            {descriptionText ? (
              <p className="font-sans leading-relaxed text-body">{descriptionText}</p>
            ) : null}
          </VariableProductImagePicker>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ScrollReveal
              className="relative aspect-square w-full overflow-hidden rounded-3xl bg-blush"
              rootMargin="0px 0px 12% 0px"
            >
              {product.imageUrl ? (
                product.imageUrl.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center font-sans text-body">
                  No image
                </div>
              )}
            </ScrollReveal>

            <ScrollReveal
              className="flex flex-col gap-6"
              delayMs={90}
              rootMargin="0px 0px 12% 0px"
            >
              <h1 className="font-heading text-3xl text-heading sm:text-4xl">{product.name}</h1>
              <p className="font-sans text-xl font-semibold text-heading">{product.priceLabel}</p>

              {product.colorOptions.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {product.colorOptions.map((opt, i) => (
                      <span
                        key={`${opt}-${i}`}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 font-sans text-sm text-heading"
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: optionToSwatchColor(opt, product.name) }}
                        />
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {product.variations.length > 0 ? (
                <div>
                  <p className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-body">
                    Variations
                  </p>
                  <ul className="flex flex-col gap-2 font-sans text-sm text-body">
                    {product.variations.map((v) => (
                      <li key={v.id} className="flex justify-between gap-4 rounded-xl bg-white/50 px-3 py-2">
                        <span className="text-heading">{v.label}</span>
                        <span className="font-medium text-heading">{v.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {product.databaseId > 0 ? (
                <AddToCartButton productId={product.databaseId} />
              ) : null}

              {descriptionText ? (
                <p className="font-sans leading-relaxed text-body">{descriptionText}</p>
              ) : null}
            </ScrollReveal>
          </div>
        )}

        {detailClip ? (
          <ScrollReveal
            className="w-full max-w-3xl"
            delayMs={140}
            rootMargin="0px 0px 12% 0px"
          >
            <ProductDetailVideo src={detailClip.url} />
          </ScrollReveal>
        ) : null}

        {showBundleSiblings ? <GlowBearBundleMoreColours siblings={bundleSiblings} /> : null}
      </main>
      <FooterValues />
    </div>
  );
}
