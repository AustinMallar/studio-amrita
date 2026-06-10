"use client";

import { GLOW_BEARS } from "@/lib/game/constants";
import type { BearId } from "@/lib/game/types";

type Props = {
  onSelect: (bearId: BearId) => void;
  showIntro?: boolean;
};

export function CharacterSelect({ onSelect, showIntro = true }: Props) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
      {showIntro ? (
        <div>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
            Berry Bump ♡
          </p>
          <h2 className="mt-3 font-heading text-2xl text-heading sm:text-3xl">
            Choose your Glow Bear
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-body">
            Catch crochet strawberries in your basket. Dodge yarn bombs (−3 points). Bump rivals to
            shove them aside, or jump to hop right over them!
          </p>
        </div>
      ) : (
        <div>
          <h3 className="font-heading text-2xl text-heading sm:text-3xl">Choose your Glow Bear</h3>
          <p className="mt-3 font-sans text-sm leading-relaxed text-body">
            Catch crochet strawberries in your basket. Dodge yarn bombs (−3 points). Bump rivals to
            shove them aside, or jump to hop right over them!
          </p>
        </div>
      )}

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {GLOW_BEARS.map((bear) => (
          <button
            key={bear.id}
            type="button"
            onClick={() => onSelect(bear.id)}
            className="group flex select-none touch-manipulation flex-col items-center gap-2 rounded-2xl border border-black/[0.06] bg-cream/80 px-4 pb-4 pt-5 transition hover:border-dusty-rose/40 hover:bg-blush/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose"
          >
            <img
              src={`/game/sprites/bear-${bear.id}.svg`}
              alt={bear.name}
              width={72}
              height={82}
              className="transition group-hover:scale-105 drop-shadow-sm"
              aria-hidden
            />
            <span className="font-heading text-sm text-heading">{bear.name}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-blush/30 px-5 py-4 text-left font-sans text-xs leading-relaxed text-body">
        <p className="font-semibold text-heading">Controls</p>
        <p className="mt-1">
          <strong className="text-heading">Move:</strong> ← → or A / D
        </p>
        <p className="mt-1">
          <strong className="text-heading">Bump:</strong> Space — shove the nearest rival
        </p>
        <p className="mt-1">
          <strong className="text-heading">Jump:</strong> ↑ or W — hop over other bears
        </p>
        <p className="mt-2 text-dusty-rose">
          On-screen buttons work on touch and mouse too.
        </p>
      </div>
    </div>
  );
}
