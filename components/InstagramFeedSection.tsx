import { getInstagramPosts } from "@/lib/instagram-feed";
import { SOCIAL_LINKS } from "@/lib/social-links";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SocialLinks } from "@/components/SocialLinks";

export async function InstagramFeedSection() {
  const posts = await getInstagramPosts(6);
  const { href, handle } = SOCIAL_LINKS.instagram;

  return (
    <section className="border-t border-black/[0.04] bg-cream px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
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
            <Link href={href} className="text-dusty-rose hover:underline" target="_blank" rel="noopener noreferrer">
              {handle}
            </Link>
            .
          </p>
        </ScrollReveal>

        {posts ? (
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
            {posts.map((post, i) => (
              <ScrollReveal key={post.id} delayMs={i * 40}>
                <li>
                  <Link
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-2xl border border-black/[0.06] bg-blush/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose"
                  >
                    <Image
                      src={post.imageUrl}
                      alt={post.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 bg-heading/0 transition group-hover:bg-heading/10" />
                  </Link>
                </li>
              </ScrollReveal>
            ))}
          </ul>
        ) : (
          <ScrollReveal className="mt-10 flex flex-col items-center gap-6 rounded-3xl border border-black/[0.06] bg-blush/35 px-6 py-12 text-center">
            <p className="max-w-md font-sans text-sm leading-relaxed text-body">
              Follow us for the latest bears, packaging previews, and studio moments. A live feed
              appears here once Instagram API credentials are configured.
            </p>
            <SocialLinks size="lg" />
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
          >
            View on Instagram ♡
          </Link>
          {posts ? <SocialLinks /> : null}
        </ScrollReveal>
      </div>
    </section>
  );
}
