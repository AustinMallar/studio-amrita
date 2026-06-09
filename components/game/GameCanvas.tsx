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
  const inputRef = useRef<InputState>({ left: false, right: false, bump: false, jump: false });
  const touchRef = useRef({ left: false, right: false });
  const completedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const [spritesReady, setSpritesReady] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

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

  const syncInput = useCallback(() => {
    const touch = touchRef.current;
    engineRef.current?.setInput({
      left: inputRef.current.left || touch.left,
      right: inputRef.current.right || touch.right,
      bump: inputRef.current.bump,
      jump: inputRef.current.jump,
    });
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
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        inputRef.current.jump = true;
        e.preventDefault();
      }
      syncInput();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") inputRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.right = false;
      if (e.key === " " || e.key === "Enter") inputRef.current.bump = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") inputRef.current.jump = false;
      syncInput();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [syncInput]);

  const setTouch = (side: "left" | "right", active: boolean) => {
    touchRef.current[side] = active;
    syncInput();
  };

  const pulseAction = (action: "bump" | "jump") => {
    inputRef.current[action] = true;
    syncInput();
    setTimeout(() => {
      inputRef.current[action] = false;
      syncInput();
    }, 80);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-sm border-4 border-[#a87840] bg-[#503818] shadow-[inset_0_0_0_2px_#281808,0_8px_24px_rgba(40,32,24,0.35)]"
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} className="block w-full" aria-label="Berry Bump game arena" />

        {showHint && (
          <div
            className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3"
            aria-hidden
          >
            <div className="rounded-full border border-white/30 bg-[#281808]/80 px-4 py-2 text-center font-sans text-xs font-semibold tracking-wide text-white shadow-lg backdrop-blur-sm sm:text-sm">
              <span className="text-dusty-rose">BUMP</span> rivals to shove them ·{" "}
              <span className="text-[#90e0f8]">JUMP</span> to hop over them
            </div>
          </div>
        )}
      </div>

      <GameControls
        onMoveLeft={(active) => setTouch("left", active)}
        onMoveRight={(active) => setTouch("right", active)}
        onBump={() => pulseAction("bump")}
        onJump={() => pulseAction("jump")}
      />
    </div>
  );
}

function GameControls({
  onMoveLeft,
  onMoveRight,
  onBump,
  onJump,
}: {
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  onBump: () => void;
  onJump: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-[#a87840]/60 bg-cream/90 px-4 py-4 shadow-sm">
      <p className="text-center font-sans text-sm font-semibold text-heading">
        Catch berries — bump rivals, jump over them
      </p>

      <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3">
        <MoveButton label="Move left" onStart={() => onMoveLeft(true)} onEnd={() => onMoveLeft(false)}>
          ←
        </MoveButton>

        <ActionButton
          label="Jump over bears"
          onTrigger={onJump}
          className="min-w-[4.5rem] border-[#5cb838]/40 bg-[#e8f5e0] text-[#2a6018] hover:bg-[#d4edc8] active:bg-[#b8e0a8]"
        >
          Jump
        </ActionButton>

        <MoveButton label="Move right" onStart={() => onMoveRight(true)} onEnd={() => onMoveRight(false)}>
          →
        </MoveButton>
      </div>

      <div className="mt-3 flex justify-center">
        <ActionButton
          label="Bump rival bear"
          onTrigger={onBump}
          className="h-14 min-w-[10rem] bg-dusty-rose text-base font-bold uppercase tracking-widest text-white shadow-md hover:bg-dusty-rose/90 active:scale-[0.98] sm:min-w-[12rem] sm:text-lg"
        >
          Bump!
        </ActionButton>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-xs text-body">
        <ControlHint keys={["←", "→"]} label="move" />
        <ControlHint keys={["Space"]} label="bump" highlight />
        <ControlHint keys={["↑", "W"]} label="jump" />
      </div>
    </div>
  );
}

function ControlHint({
  keys,
  label,
  highlight = false,
}: {
  keys: string[];
  label: string;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className={`inline-flex min-w-[1.6rem] items-center justify-center rounded border px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold shadow-sm ${
            highlight
              ? "border-dusty-rose/50 bg-dusty-rose text-white"
              : "border-black/10 bg-white text-heading"
          }`}
        >
          {key}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}

function MoveButton({
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
      className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.08] bg-white font-sans text-xl text-heading shadow-sm active:bg-blush sm:h-14 sm:w-14"
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

function ActionButton({
  children,
  label,
  onTrigger,
  className = "",
}: {
  children: ReactNode;
  label: string;
  onTrigger: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-12 items-center justify-center rounded-full border border-black/[0.08] px-5 font-sans text-sm font-semibold transition active:scale-[0.97] sm:h-12 ${className}`}
      onTouchStart={(e) => {
        e.preventDefault();
        onTrigger();
      }}
      onMouseDown={onTrigger}
    >
      {children}
    </button>
  );
}
