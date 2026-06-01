"use client";

import type { BearState } from "@/lib/game/types";

type Props = {
  bears: BearState[];
  spawnProgress: number;
  treeShaking: boolean;
};

export function GameHUD({ bears, spawnProgress, treeShaking }: Props) {
  const player = bears.find((b) => b.isPlayer);

  return (
    <div className="flex flex-col gap-2" aria-live="polite" aria-atomic="true">
      {player && (
        <p className="sr-only">
          Your score: {player.score}. Round {Math.round(spawnProgress * 100)}% complete.
        </p>
      )}

      <div className="h-2 overflow-hidden rounded-sm border-2 border-[#a87840] bg-[#282018]">
        <div
          className="h-full bg-[#58b830] transition-[width] duration-300"
          style={{ width: `${Math.min(100, spawnProgress * 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(spawnProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Round progress"
        />
      </div>

      {treeShaking && (
        <p className="text-center font-mono text-xs font-bold uppercase tracking-wide text-[#f0a020]">
          ★ Tree shake! Catch the burst! ★
        </p>
      )}
    </div>
  );
}
