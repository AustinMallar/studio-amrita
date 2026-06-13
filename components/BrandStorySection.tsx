import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HOMEPAGE_STORY_VIDEO, StorySectionVideo } from "@/components/StorySectionVideo";
import { PRODUCT_NAMES } from "@/lib/product-names";

export function BrandStorySection() {
  return (
    <section className="bg-blush px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal rootMargin="0px 0px 12% 0px">
          <StorySectionVideo
            src={HOMEPAGE_STORY_VIDEO}
            ariaLabel={`Studio Amrita ${PRODUCT_NAMES.glowBears} and gift-ready packaging`}
          />
        </ScrollReveal>
        <ScrollReveal className="flex flex-col gap-6" delayMs={70} rootMargin="0px 0px 12% 0px">
          <h2 className="font-heading text-3xl leading-snug text-heading sm:text-4xl">
            Handmade. <br></br>Thoughtful. <br></br>Gift-ready.
          </h2>
          <p className="font-sans text-base leading-relaxed text-body">
            Studio Amrita pairs handmade crochet bears with curated skincare minis so every
            gift feels personal, with soft textures, quiet rituals, and a little sparkle for everyday
            routines.
          </p>
          <p className="font-sans text-base leading-relaxed text-body">
            We design for slow gifting: pieces that feel considered on a shelf, joyful to unwrap,
            and easy to love long after the bow comes off.
          </p>
          <div>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
            >
              OUR STORY ♡
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
