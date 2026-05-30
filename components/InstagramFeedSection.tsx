import { SOCIAL_LINKS } from "@/lib/social-links";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SocialLinks } from "@/components/SocialLinks";
import Link from "next/link";
import Script from "next/script";

/** Elfsight Instagram Feed widget app id. */
const ELFSIGHT_APP_CLASS = "elfsight-app-03378208-66d2-4021-8c3b-c5277488cf9f";

export function InstagramFeedSection() {
  const { href, handle } = SOCIAL_LINKS.instagram;

  return (
    <section className="border-t border-black/[0.04] bg-cream px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
            FOLLOW ALONG ♡
          </p>
          <h2 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">
            On Instagram
          </h2>
          <p className="mt-4 font-sans text-base leading-relaxed text-body">
            Behind-the-scenes making, new drops, and gift inspiration from{" "}
            <Link
              href={href}
              className="text-dusty-rose hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {handle}
            </Link>
            .
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-12 min-h-[280px] w-full">
          <div className={ELFSIGHT_APP_CLASS} data-elfsight-app-lazy />
        </ScrollReveal>

        <ScrollReveal className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
          >
            View on Instagram ♡
          </Link>
          <SocialLinks />
        </ScrollReveal>
      </div>
    </section>
  );
}
