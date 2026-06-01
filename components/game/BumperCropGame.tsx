"use client";

import { useCallback, useState } from "react";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import { GameResults } from "@/components/game/GameResults";
import type { BearId, GamePhase, GameSnapshot, RoundResult } from "@/lib/game/types";

export function BumperCropGame() {
  const [phase, setPhase] = useState<GamePhase>("select");
  const [playerBearId, setPlayerBearId] = useState<BearId>("matcha");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleSelect = (bearId: BearId) => {
    setPlayerBearId(bearId);
    setResult(null);
    setSnapshot(null);
    setGameKey((k) => k + 1);
    setPhase("playing");
  };

  const handleRoundComplete = useCallback((roundResult: RoundResult) => {
    setResult(roundResult);
    setPhase("results");
  }, []);

  const handleSnapshot = useCallback((snap: GameSnapshot) => {
    setSnapshot(snap);
  }, []);

  const handlePlayAgain = () => {
    setResult(null);
    setSnapshot(null);
    setPhase("select");
  };

  const handleRematch = () => {
    setResult(null);
    setSnapshot(null);
    setGameKey((k) => k + 1);
    setPhase("playing");
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {phase === "select" && <CharacterSelect onSelect={handleSelect} />}

      {phase === "playing" && (
        <div className="flex flex-col gap-3">
          <GameCanvas
            key={gameKey}
            playerBearId={playerBearId}
            onRoundComplete={handleRoundComplete}
            onSnapshot={handleSnapshot}
          />
          {snapshot && (
            <GameHUD
              bears={snapshot.bears}
              spawnProgress={snapshot.spawnProgress}
              treeShaking={snapshot.treeShake > 0.1}
            />
          )}
        </div>
      )}

      {phase === "results" && result && (
        <GameResults result={result} onPlayAgain={handlePlayAgain} onRematch={handleRematch} />
      )}
    </div>
  );
}
