"use client";

import { GLOW_BEARS } from "@/lib/game/constants";
import type { BearId } from "@/lib/game/types";

type Props = {
  onSelect: (bearId: BearId) => void;
};

export function CharacterSelect({ onSelect }: Props) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
      <div>
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
          Berry Bump ♡
        </p>
        <h2 className="mt-3 font-heading text-2xl text-heading sm:text-3xl">
          Choose your Glow Bear
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-body">
          Catch crochet strawberries in your basket. Dodge yarn bombs (−3 points). Bump rivals to
          steal their spot — hold still to push, move to swap!
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {GLOW_BEARS.map((bear) => (
          <button
            key={bear.id}
            type="button"
            onClick={() => onSelect(bear.id)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-black/[0.06] bg-cream/80 px-4 pb-4 pt-5 transition hover:border-dusty-rose/40 hover:bg-blush/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose"
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
          <strong className="text-heading">Desktop:</strong> ← → move, Space bump
        </p>
        <p className="mt-1">
          <strong className="text-heading">Mobile:</strong> on-screen arrows + bump button
        </p>
      </div>
    </div>
  );
}
