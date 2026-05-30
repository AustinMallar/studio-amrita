import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About | Studio Amrita",
  description:
    "The story behind Studio Amrita — handmade crochet glow bears, curated skincare minis, and gift-ready packaging made for slow, thoughtful gifting.",
};

function Pillar({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-cream/80 p-6">
      <div className="text-dusty-rose">{icon}</div>
      <h3 className="font-heading text-lg text-heading">{title}</h3>
      <p className="font-sans text-sm leading-relaxed text-body">{body}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-black/[0.04] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <nav className="font-sans text-sm text-body">
                <Link href="/" className="text-dusty-rose hover:underline">
                  ← Back to home
                </Link>
              </nav>
            </ScrollReveal>

            <ScrollReveal className="mt-10" delayMs={40}>
              <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
                OUR STORY ♡
              </p>
              <h1 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">
                Handmade. Thoughtful. Gift-ready.
              </h1>
              <p className="mt-4 font-sans text-base leading-relaxed text-body">
                Studio Amrita pairs handmade crochet characters with curated skincare minis so every
                gift feels personal — soft textures, quiet rituals, and a little sparkle for
                everyday routines.
              </p>
            </ScrollReveal>
          </div>
        </section>

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
              <h2 className="font-heading text-2xl leading-snug text-heading sm:text-3xl">
                Slow gifting, made with care
              </h2>
              <p className="font-sans text-base leading-relaxed text-body">
                We design for gifts that feel considered on a shelf, joyful to unwrap, and easy to
                love long after the bow comes off. Each piece is made in small batches — never
                rushed, always intentional.
              </p>
              <p className="font-sans text-base leading-relaxed text-body">
                Every glow bear is crocheted by hand with premium matte chenille yarn for a soft,
                huggable texture. It takes about two hours to make each one, and no two are exactly
                alike.
              </p>
              <p className="font-sans text-base leading-relaxed text-body">
                We pair each bear with Korean lip balm and hand cream minis, chosen so the flavors
                complement the bear&apos;s colour for a cohesive, gift-ready set.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl text-heading sm:text-3xl">What we believe in</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-body">
                Small details add up to something that feels truly special.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ScrollReveal delayMs={0}>
                <Pillar
                  title="Handmade with love"
                  body="Crafted in small batches with premium chenille yarn — each bear is a little work of art."
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.046a4.5 4.5 0 010-6.364z"
                      />
                    </svg>
                  }
                />
              </ScrollReveal>
              <ScrollReveal delayMs={44}>
                <Pillar
                  title="Gift-ready from the start"
                  body="Clear packaging, a satin bow, and a gift tag — ready to give the moment it arrives."
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>
                  }
                />
              </ScrollReveal>
              <ScrollReveal delayMs={88} className="sm:col-span-2 lg:col-span-1">
                <Pillar
                  title="Skincare that sparkles"
                  body="Curated Korean minis paired with each bear — a daily glow-up in a tiny, joyful package."
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  }
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="border-t border-black/[0.06] bg-cream px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <ScrollReveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="font-heading text-2xl text-heading sm:text-3xl">Ready to find your glow?</h2>
            <p className="font-sans text-sm leading-relaxed text-body">
              Explore our glow bear bundles — or read our FAQ
              for shipping, skincare, and packaging details.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#choose-your-glow"
                className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
              >
                Shop collections ♡
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-full border border-dusty-rose/40 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-heading transition hover:border-dusty-rose hover:text-dusty-rose"
              >
                Read FAQ
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <FooterValues />
    </div>
  );
}
