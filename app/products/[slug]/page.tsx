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
import { JsonLd } from "@/components/JsonLd";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VariableProductImagePicker } from "@/components/VariableProductImagePicker";
import { FooterValues } from "@/components/FooterValues";
import { ProductDetailGallery } from "@/components/ProductDetailGallery";
import { ProductDetailVideo } from "@/components/ProductDetailVideo";
import { ProductDescription } from "@/components/ProductDescription";
import { ProductDigitalCallout } from "@/components/ProductDigitalCallout";
import { ProductShippingCallout } from "@/components/ProductShippingCallout";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { productQualifiesForGlowBearFreeShipping } from "@/lib/shipping";
import { optionToSwatchColor } from "@/lib/product-swatches";
import { productPageSchemas } from "@/lib/schema";
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

  const bundleCatSlug = CATEGORY_SLUGS["Essential Glow Bear"];
  const showBundleSiblings =
    Array.isArray(product.categorySlugs) && product.categorySlugs.includes(bundleCatSlug);
  const bundleSiblings = showBundleSiblings
    ? await getGlowBearBundleSiblings(product.slug)
    : [];

  const descriptionHtml = String(product.descriptionHtml ?? "");

  const isVariableProduct =
    product.variations.length > 0 && /variable/i.test(String(product.productType || ""));

  const detailClip = getFrontendHoverVideo(product.slug);
  const showGlowBearFreeShipping = productQualifiesForGlowBearFreeShipping(
    product.categorySlugs
  );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <JsonLd data={productPageSchemas(product)} />
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

        {isVariableProduct ? (
          <VariableProductImagePicker
            productDatabaseId={product.databaseId}
            productName={product.name}
            fallbackImageUrl={product.imageUrl}
            fallbackImageAlt={product.imageAlt}
            fallbackPrice={product.priceLabel}
            variationAttributes={product.variationAttributes}
            variations={product.variations}
            galleryImages={product.galleryImages}
          >
            {product.downloadable ? <ProductDigitalCallout /> : null}
            {!product.downloadable && showGlowBearFreeShipping ? (
              <ProductShippingCallout />
            ) : null}
            {descriptionHtml ? (
              <ProductDescription html={descriptionHtml} />
            ) : null}
          </VariableProductImagePicker>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
            {product.imageUrl ? (
              <ProductDetailGallery
                mainImageUrl={product.imageUrl}
                mainImageAlt={product.imageAlt}
                galleryImages={product.galleryImages}
              />
            ) : (
              <ScrollReveal
                className="relative aspect-square w-full overflow-hidden rounded-3xl bg-blush"
                rootMargin="0px 0px 12% 0px"
              >
                <div className="flex h-full items-center justify-center font-sans text-body">
                  No image
                </div>
              </ScrollReveal>
            )}

            <div className="lg:sticky lg:top-28 lg:self-start">
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

              {product.downloadable ? <ProductDigitalCallout /> : null}
              {!product.downloadable && showGlowBearFreeShipping ? (
                <ProductShippingCallout />
              ) : null}

              {product.databaseId > 0 ? (
                <AddToCartButton productId={product.databaseId} />
              ) : null}

              {descriptionHtml ? (
                <ProductDescription html={descriptionHtml} />
              ) : null}
              </ScrollReveal>
            </div>
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
