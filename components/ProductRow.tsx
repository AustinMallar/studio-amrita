import Link from "next/link";
import Image from "next/image";
import { optionToSwatchColor } from "@/lib/product-swatches";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProductCard, type UiProduct } from "./ProductCard";
import { DEMO_GRID_PRODUCTS } from "./demo-products";

export type ProductRowProps = {
  categoryName: string;
  layoutType: "grid" | "lifestyle";
  description: string;
  shopHref: string;
  shopLabel: string;
  products: UiProduct[];
  lifestyleImageUrl?: string | null;
  lifestyleImageAlt?: string;
  /** Colour options for variable products (e.g. Classic row). */
  lifestyleColorSwatches?: string[];
};

export function ProductRow({
  categoryName,
  layoutType,
  description,
  shopHref,
  shopLabel,
  products,
  lifestyleImageUrl,
  lifestyleImageAlt,
  lifestyleColorSwatches,
}: ProductRowProps) {
  const gridItems =
    products.length > 0 ? products.slice(0, 4) : (DEMO_GRID_PRODUCTS as UiProduct[]);

  const lifestyleSrc =
    lifestyleImageUrl && lifestyleImageUrl.length > 0
      ? lifestyleImageUrl
      : "/hero-bear.png";
  const lifestyleAlt = lifestyleImageAlt ?? categoryName;
  const lifestyleRemote = lifestyleSrc.startsWith("http");

  return (
    <section className="border-t border-black/[0.04] bg-cream px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:gap-14">
        <ScrollReveal className="flex flex-col gap-4 lg:col-span-1">
          <h3 className="text-2xl text-heading sm:text-3xl">{categoryName}</h3>
          <p className="font-sans text-base leading-relaxed text-body">{description}</p>
          <Link
            href={shopHref}
            className="mt-2 inline-flex w-fit items-center font-sans text-sm font-semibold uppercase tracking-wide text-dusty-rose hover:underline"
          >
            {shopLabel}
          </Link>
        </ScrollReveal>

        <div className="lg:col-span-2">
          {layoutType === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {gridItems.map((p, i) => (
                <ScrollReveal
                  key={p.id}
                  className="min-w-0"
                  delayMs={36 + i * 56}
                >
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="flex flex-col gap-4">
                {shopHref.startsWith("/products/") ? (
                  <Link
                    href={shopHref}
                    className="group relative block aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-3xl bg-blush outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose"
                  >
                    {lifestyleRemote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lifestyleSrc}
                        alt={lifestyleAlt}
                        className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={lifestyleSrc}
                        alt={lifestyleAlt}
                        fill
                        className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    )}
                  </Link>
                ) : (
                  <div className="relative aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-3xl bg-blush">
                    {lifestyleRemote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lifestyleSrc}
                        alt={lifestyleAlt}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={lifestyleSrc}
                        alt={lifestyleAlt}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    )}
                  </div>
                )}
                {lifestyleColorSwatches && lifestyleColorSwatches.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pl-0.5">
                    <span className="font-sans text-xs font-medium uppercase tracking-wide text-body">
                      Colours:
                    </span>
                    {lifestyleColorSwatches.slice(0, 8).map((opt, i) => (
                      <span
                        key={`lifestyle-sw-${i}`}
                        title={opt}
                        className="h-5 w-5 rounded-full border border-black/10 ring-2 ring-white"
                        style={{ backgroundColor: optionToSwatchColor(opt, categoryName) }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
