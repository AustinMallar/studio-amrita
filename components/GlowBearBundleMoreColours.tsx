import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PRODUCT_NAMES } from "@/lib/product-names";
import { optionToSwatchColor } from "@/lib/product-swatches";

export type BundleSibling = {
  slug: string;
  name: string;
  displayName?: string;
  imageUrl: string;
  imageAlt: string;
};

export function GlowBearBundleMoreColours({ siblings }: { siblings: BundleSibling[] }) {
  if (siblings.length === 0) return null;

  return (
    <section className="border-t border-black/[0.06] pt-10 lg:pt-12">
      <ScrollReveal className="max-w-2xl">
        <h2 className="font-heading text-2xl text-heading sm:text-3xl">
          More colours in the {PRODUCT_NAMES.essentialGlowBear}
        </h2>
        <p className="mt-2 font-sans text-base leading-relaxed text-body">
          This {PRODUCT_NAMES.essentialGlowBear} is available in every shade below. Open another colour to see its
          full product page.
        </p>
      </ScrollReveal>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-3">
        {siblings.map((s, i) => {
          const remote = Boolean(s.imageUrl && s.imageUrl.startsWith("http"));
          return (
            <li key={s.slug}>
              <ScrollReveal className="h-full" delayMs={40 + i * 56}>
              <Link
                href={`/products/${s.slug}`}
                className="group flex flex-col gap-3 rounded-2xl bg-white/60 p-3 text-center shadow-[0_2px_8px_rgba(92,77,77,0.07),0_1px_2px_rgba(92,77,77,0.04)] transition hover:shadow-[0_4px_14px_rgba(92,77,77,0.1)]"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-blush/80">
                  {s.imageUrl ? (
                    remote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imageUrl}
                        alt={s.imageAlt}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={s.imageUrl}
                        alt={s.imageAlt}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center font-sans text-xs text-body">
                      No image
                    </div>
                  )}
                </div>
                <span className="font-sans text-sm font-semibold text-heading group-hover:text-dusty-rose">
                  {s.displayName ?? s.name}
                </span>
                <span className="flex justify-center">
                  <span
                    className="h-4 w-4 rounded-full border border-black/10 ring-2 ring-white"
                    style={{ backgroundColor: optionToSwatchColor(s.name, s.name) }}
                    aria-hidden
                  />
                </span>
              </Link>
              </ScrollReveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
