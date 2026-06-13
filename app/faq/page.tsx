import { FooterValues } from "@/components/FooterValues";
import { JsonLd } from "@/components/JsonLd";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { FAQ_ITEMS } from "@/lib/faq-content";
import { PRODUCT_NAMES } from "@/lib/product-names";
import { faqPageSchema } from "@/lib/schema";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Studio Amrita",
  description: `Questions about our crochet ${PRODUCT_NAMES.glowBears}, skincare minis, shipping, and gift-ready packaging.`,
};

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <JsonLd data={faqPageSchema(FAQ_ITEMS)} />
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <header>
          <h1 className="font-heading text-3xl text-heading">FAQ</h1>
          <p className="mt-2 max-w-xl font-sans text-sm text-body">
            Answers about our bears, skincare minis, shipping, and packaging.
          </p>
        </header>

        <dl className="space-y-10 border-t border-black/[0.06] pt-10">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <div key={question}>
              <dt className="font-heading text-lg leading-snug text-heading">{question}</dt>
              <dd className="mt-3 font-sans text-sm leading-relaxed text-body">{answer}</dd>
            </div>
          ))}
        </dl>
      </main>
      <FooterValues />
    </div>
  );
}
