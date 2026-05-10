import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Studio Amrita",
  description:
    "Questions about our crochet glow bears, skincare minis, shipping, and gift-ready packaging.",
};

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What inspired the crochet bears and skincare pairing?",
    answer:
      "We wanted to bring something cute and joyful together with everyday self-care; so each bear comes with a mini glow-up.",
  },
  {
    question: "How are the bears made?",
    answer:
      "Each bear is crocheted with premium matte chenille yarn, giving it a soft, huggable texture. It takes about two hours to make each one.",
  },
  {
    question: "What skincare minis are included?",
    answer:
      "Each bear is paired with a Korean lip balm and a hand cream. The flavors match the bear’s color for a fun, cohesive gift.",
  },
  {
    question: "What’s your shipping policy?",
    answer:
      "We offer free shipping on all orders. If there’s ever an issue, our customer service is ready to help.",
  },
  {
    question: "Is the packaging gift-ready?",
    answer:
      "Yes! The bear is in clear packaging, tied with a bow and a gift tag, so it’s ready to give right away.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
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
