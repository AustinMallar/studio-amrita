import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";

function Value({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="mb-3 text-dusty-rose">{icon}</div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading">{title}</h3>
      <p className="mt-1 max-w-[220px] font-sans text-sm text-body">{body}</p>
    </div>
  );
}

export function FooterValues() {
  const blocks = [
    {
      title: "Free Shipping",
      body: "On orders over $50.",
      icon: (
        <svg className="mx-auto h-8 w-8 sm:mx-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.15} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17V6a1 1 0 00-1-1H8L5 9v8h3m5-8h3l3 4v4h-3" />
        </svg>
      ),
    },
    {
      title: "Easy Returns",
      body: "14-day return policy.",
      icon: (
        <svg className="mx-auto h-8 w-8 sm:mx-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.15} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: "Secure Checkout",
      body: "Safe & protected.",
      icon: (
        <svg className="mx-auto h-8 w-8 sm:mx-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.15} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Made with Love",
      body: "Always & forever.",
      icon: (
        <svg className="mx-auto h-8 w-8 sm:mx-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.15} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.046a4.5 4.5 0 010-6.364z" />
        </svg>
      ),
    },
  ] as const;

  return (
    <footer className="border-t border-black/[0.06] bg-cream px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {blocks.map((item, i) => (
          <ScrollReveal key={item.title} delayMs={i * 44}>
            <Value title={item.title} body={item.body} icon={item.icon} />
          </ScrollReveal>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-center font-sans text-xs text-body">
        © {new Date().getFullYear()} Studio Amrita. All rights reserved.
      </p>
    </footer>
  );
}
