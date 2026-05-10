import { ScrollReveal } from "@/components/ScrollReveal";

export function CollectionsIntro() {
  return (
    <section
      id="choose-your-glow"
      className="scroll-mt-28 bg-cream px-4 pb-4 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20"
    >
      <ScrollReveal className="mx-auto max-w-2xl">
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
          OUR COLLECTIONS ♡
        </p>
        <h2 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">Choose Your Glow</h2>
      </ScrollReveal>
    </section>
  );
}
