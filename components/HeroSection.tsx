import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-dusty-rose">{icon}</div>
      <div>
        <p className="font-sans text-sm font-semibold text-heading">{title}</p>
        <p className="font-sans text-xs text-body">{subtitle}</p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <ScrollReveal
          className="order-2 flex flex-col gap-6 lg:order-1"
          rootMargin="0px 0px 12% 0px"
        >
          <p className="font-sans text-sm font-semibold uppercase tracking-widest text-dusty-rose">
            NEW ARRIVAL ♡
          </p>
          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl lg:text-[3.25rem]">
            Glow Bears Collection
          </h1>
          <p className="font-sans text-xl text-heading/90">Tiny bears. Big on joy.</p>
          <p className="max-w-md font-sans text-base leading-relaxed text-body">
            Handmade with love and paired with skincare minis for a daily dose of glow.
          </p>
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
            >
              SHOP NOW ♡
            </Link>
          </div>
          <div className="mt-4 grid gap-5 border-t border-black/[0.06] pt-8 sm:grid-cols-3 sm:gap-6">
            <Feature
              title="Handmade with Love"
              subtitle="Crafted in small batches."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.046a4.5 4.5 0 010-6.364z"
                  />
                </svg>
              }
            />
            <Feature
              title="Perfect for Gifting"
              subtitle="Ready-to-give packaging."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              }
            />
            <Feature
              title="Skincare Essentials"
              subtitle="Minis included with bears."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
          </div>
        </ScrollReveal>

        <ScrollReveal
          className="order-1 flex justify-center lg:order-2 lg:justify-end"
          delayMs={85}
          rootMargin="0px 0px 12% 0px"
        >
          <div className="relative w-full max-w-lg">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[48%] bg-blush px-8 pb-12 pt-14 sm:px-12 sm:pb-16 sm:pt-16">
              <Image
                src="/hero-bear.png"
                alt="Crocheted glow bear in a clear gift box with a pink bow"
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 1024px) 100vw, 480px"
                priority
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
