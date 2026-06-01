"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game/engine/GameEngine";
import { loadSprites, type SpriteSheet } from "@/lib/game/sprites";
import type { BearId, GameSnapshot, InputState, RoundResult } from "@/lib/game/types";

type Props = {
  playerBearId: BearId;
  onRoundComplete: (result: RoundResult) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
};

function useReducedMotion(): boolean {
  return useSyncExternalStoreReducedMotion();
}

function useSyncExternalStoreReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function GameCanvas({ playerBearId, onRoundComplete, onSnapshot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const inputRef = useRef<InputState>({ left: false, right: false, bump: false });
  const touchRef = useRef({ left: false, right: false });
  const completedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const [spritesReady, setSpritesReady] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = parent.clientWidth;
    const height = Math.max(280, Math.min(440, width * 0.55));

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    engine.setSize(width, height);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSprites().then((sprites: SpriteSheet) => {
      if (cancelled) return;
      engineRef.current?.setSprites(sprites);
      setSpritesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    completedRef.current = false;
    const engine = new GameEngine(playerBearId);
    engine.setReducedMotion(reducedMotion);
    engineRef.current = engine;
    resizeCanvas();

    const loop = (now: number) => {
      const eng = engineRef.current;
      const canvas = canvasRef.current;
      if (!eng || !canvas) return;

      eng.setReducedMotion(reducedMotion);
      eng.tick(now);
      const ctx = canvas.getContext("2d");
      if (ctx) eng.render(ctx);

      const snapshot = eng.getSnapshot();
      onSnapshot(snapshot);

      const result = eng.getRoundResult();
      if (result && !completedRef.current) {
        completedRef.current = true;
        onRoundComplete(result);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playerBearId, reducedMotion, onRoundComplete, onSnapshot, resizeCanvas]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas, spritesReady]);

  useEffect(() => {
    const onVisibility = () => {
      engineRef.current?.setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        inputRef.current.left = true;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        inputRef.current.right = true;
        e.preventDefault();
      }
      if (e.key === " " || e.key === "Enter") {
        inputRef.current.bump = true;
        e.preventDefault();
      }
      syncInput();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") inputRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.right = false;
      if (e.key === " " || e.key === "Enter") inputRef.current.bump = false;
      syncInput();
    };

    const syncInput = () => {
      const touch = touchRef.current;
      engineRef.current?.setInput({
        left: inputRef.current.left || touch.left,
        right: inputRef.current.right || touch.right,
        bump: inputRef.current.bump,
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const setTouch = (side: "left" | "right", active: boolean) => {
    touchRef.current[side] = active;
    engineRef.current?.setInput({
      left: inputRef.current.left || touchRef.current.left,
      right: inputRef.current.right || touchRef.current.right,
      bump: inputRef.current.bump,
    });
  };

  const triggerBump = () => {
    engineRef.current?.setInput({
      left: inputRef.current.left || touchRef.current.left,
      right: inputRef.current.right || touchRef.current.right,
      bump: true,
    });
    setTimeout(() => {
      engineRef.current?.setInput({
        left: inputRef.current.left || touchRef.current.left,
        right: inputRef.current.right || touchRef.current.right,
        bump: false,
      });
    }, 80);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-sm border-4 border-[#a87840] bg-[#503818] shadow-[inset_0_0_0_2px_#281808,0_8px_24px_rgba(40,32,24,0.35)]"
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} className="block w-full" aria-label="Berry Bump game arena" />
      </div>

      <div className="flex items-center justify-center gap-3 sm:hidden">
        <TouchButton
          label="Move left"
          onStart={() => setTouch("left", true)}
          onEnd={() => setTouch("left", false)}
        >
          ←
        </TouchButton>
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            triggerBump();
          }}
          onMouseDown={triggerBump}
          className="flex h-14 min-w-[5rem] items-center justify-center rounded-full bg-dusty-rose font-sans text-sm font-semibold uppercase tracking-wide text-white"
        >
          Bump
        </button>
        <TouchButton
          label="Move right"
          onStart={() => setTouch("right", true)}
          onEnd={() => setTouch("right", false)}
        >
          →
        </TouchButton>
      </div>
    </div>
  );
}

function TouchButton({
  children,
  label,
  onStart,
  onEnd,
}: {
  children: ReactNode;
  label: string;
  onStart: () => void;
  onEnd: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-14 w-14 items-center justify-center rounded-full border border-black/[0.08] bg-cream font-sans text-xl text-heading active:bg-blush"
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onEnd();
      }}
      onTouchCancel={() => onEnd()}
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
    >
      {children}
    </button>
  );
}
