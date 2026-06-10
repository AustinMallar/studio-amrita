"use client";

import Link from "next/link";
import { BEAR_BY_ID } from "@/lib/game/constants";
import type { BearId, RoundResult } from "@/lib/game/types";

type Props = {
  result: RoundResult;
  onPlayAgain: () => void;
  onRematch: () => void;
};

export function GameResults({ result, onPlayAgain, onRematch }: Props) {
  const playerWon = result.winnerId === result.playerBearId;
  const winnerName = BEAR_BY_ID[result.winnerId].name;
  const playerName = BEAR_BY_ID[result.playerBearId].name;
  const ranked = (Object.entries(result.scores) as [BearId, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      <div>
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.25em] text-dusty-rose">
          Round over
        </p>
        <h2 className="mt-3 font-heading text-2xl text-heading sm:text-3xl">
          {playerWon ? "You win!" : `${winnerName} wins!`}
        </h2>
        <p className="mt-2 font-sans text-sm text-body">
          {playerWon
            ? `${playerName} caught the most strawberries.`
            : `Nice try, ${playerName}! ${winnerName} had the fullest basket.`}
        </p>
      </div>

      <ol className="w-full rounded-2xl border border-black/[0.06] bg-cream/80 px-5 py-4 text-left">
        {ranked.map(([id, score], i) => (
          <li
            key={id}
            className={`flex items-center justify-between border-b border-black/[0.04] py-2 last:border-0 ${id === result.playerBearId ? "font-semibold text-heading" : "text-body"}`}
          >
            <span className="flex items-center gap-2 font-sans text-sm">
              <span className="text-body/60">{i + 1}.</span>
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: BEAR_BY_ID[id].hex }}
                aria-hidden
              />
              {BEAR_BY_ID[id].name}
              {id === result.playerBearId ? " (you)" : ""}
            </span>
            <span className="font-sans text-sm">{score}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="inline-flex select-none touch-manipulation items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="inline-flex select-none touch-manipulation items-center justify-center rounded-full border border-dusty-rose/40 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-heading transition hover:border-dusty-rose hover:text-dusty-rose"
        >
          New bear
        </button>
        <Link
          href="/#choose-your-glow"
          className="inline-flex select-none touch-manipulation items-center justify-center rounded-full border border-black/[0.08] px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-body transition hover:text-dusty-rose"
        >
          Shop bears ♡
        </Link>
      </div>
    </div>
  );
}
