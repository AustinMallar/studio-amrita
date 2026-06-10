import { BumperCropGame } from "@/components/game/BumperCropGame";
import { GameDiscountTeaser } from "@/components/game/GameDiscountTeaser";
import { ScrollReveal } from "@/components/ScrollReveal";

export function BerryBumpSection() {
  return (
    <section
      id="berry-bump"
      className="border-t border-black/[0.04] bg-blush/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
            Mini-game
          </p>
          <h2 className="mt-3 font-heading text-3xl text-heading sm:text-4xl">Berry Bump</h2>
          <p className="mt-4 font-sans text-base leading-relaxed text-body">
            Pick your Glow Bear, catch falling strawberries, dodge yarn bombs, bump rivals aside,
            and jump over them for the win.
          </p>
          <GameDiscountTeaser className="mt-5" />
        </ScrollReveal>

        <ScrollReveal className="mt-10" delayMs={70}>
          <BumperCropGame showCharacterIntro={false} />
        </ScrollReveal>
      </div>
    </section>
  );
}
