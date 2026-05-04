import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

export function BrandStorySection() {
  return (
    <section className="bg-blush px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal className="relative aspect-[4/5] max-h-[520px] w-full overflow-hidden rounded-3xl bg-cream/40">
          <Image
            src="/hero-bear.png"
            alt="Glow bear with dried flowers and thoughtful packaging"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </ScrollReveal>
        <ScrollReveal className="flex flex-col gap-6" delayMs={70}>
          <h2 className="font-heading text-3xl leading-snug text-heading sm:text-4xl">
            Handmade. Thoughtful. Gift-ready.
          </h2>
          <p className="font-sans text-base leading-relaxed text-body">
            Studio Amrita pairs handmade crochet characters with curated skincare minis so every
            gift feels personal — soft textures, quiet rituals, and a little sparkle for everyday
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
