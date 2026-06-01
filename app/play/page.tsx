import { BumperCropGame } from "@/components/game/BumperCropGame";
import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Berry Bump | Studio Amrita",
  description:
    "Catch crochet strawberries with your Glow Bear in Berry Bump — a playful mini-game inspired by classic bump-and-catch arcade fun.",
};

export default function PlayPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <nav className="font-sans text-sm text-body">
              <Link href="/" className="text-dusty-rose hover:underline">
                ← Back to home
              </Link>
            </nav>
          </ScrollReveal>

          <ScrollReveal className="mt-8 text-center" delayMs={40}>
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
              Mini-game
            </p>
            <h1 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">Berry Bump</h1>
            <p className="mx-auto mt-3 max-w-lg font-sans text-sm leading-relaxed text-body">
              Pick your Glow Bear, catch falling strawberries, dodge yarn bombs, and bump your
              rivals for the win.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-10 min-h-[70dvh]" delayMs={70}>
            <BumperCropGame />
          </ScrollReveal>
        </div>
      </main>
      <FooterValues />
    </div>
  );
}
