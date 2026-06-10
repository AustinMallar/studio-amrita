"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const CLICKS_NEEDED = 5;
const CLICK_WINDOW_MS = 2000;
const LONG_PRESS_MS = 800;
const STORAGE_KEY = "amrita-berry-bump-found";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
};

export function HeroBearEasterEgg({ src, alt, width, height, sizes, priority }: Props) {
  const router = useRouter();
  const clickTimes = useRef<number[]>([]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState(false);

  const goToGame = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setToast(true);
    setTimeout(() => router.push("/#berry-bump"), 600);
  }, [router]);

  const registerClick = useCallback(() => {
    const now = Date.now();
    clickTimes.current = clickTimes.current.filter((t) => now - t < CLICK_WINDOW_MS);
    clickTimes.current.push(now);
    if (clickTimes.current.length >= CLICKS_NEEDED) {
      clickTimes.current = [];
      goToGame();
    }
  }, [goToGame]);

  const onTouchStart = () => {
    longPressTimer.current = setTimeout(goToGame, LONG_PRESS_MS);
  };

  const onTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="block w-full cursor-default overflow-hidden rounded-3xl shadow-[0_4px_24px_rgba(92,77,77,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose"
        onClick={registerClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        aria-label={`${alt}. Tap five times quickly or long-press to discover a secret.`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full pointer-events-none"
          sizes={sizes}
          priority={priority}
        />
      </button>
      {toast && (
        <p
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-dusty-rose px-4 py-2 font-sans text-xs font-semibold text-white shadow-lg"
          role="status"
        >
          You found Berry Bump!
        </p>
      )}
    </div>
  );
}
