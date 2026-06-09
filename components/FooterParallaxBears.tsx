"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 256;
const MAX_OFFSET = 48;

function parallaxProgress(el: HTMLElement) {
  const viewH = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const travel = rect.height + MAX_OFFSET;
  const belowViewport = Math.max(0, rect.bottom - viewH);
  let progress = Math.min(1, Math.max(0, 1 - belowViewport / travel));

  const atPageBottom =
    window.scrollY + viewH >= document.documentElement.scrollHeight - 2;
  if (atPageBottom) progress = 1;

  return progress;
}

function applyParallax(layer: HTMLDivElement, progress: number) {
  layer.style.opacity = String(progress);
  layer.style.transform = `translate3d(0, ${MAX_OFFSET * (1 - progress)}px, 0)`;
}

function applyStatic(layer: HTMLDivElement) {
  layer.style.opacity = "1";
  layer.style.transform = "translate3d(0, 0, 0)";
}

export function FooterParallaxBears() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const layer = layerRef.current;
    if (!el || !layer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      applyStatic(layer);
      return;
    }

    let raf = 0;

    const update = () => {
      applyParallax(layer, parallaxProgress(el));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const onMotionChange = () => {
      if (reducedMotion.matches) {
        applyStatic(layer);
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      } else {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        update();
      }
    };
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/1] w-full overflow-hidden"
      aria-hidden
    >
      <div
        ref={layerRef}
        className="footer-parallax-bears-layer absolute inset-x-0 bottom-0 will-change-transform"
        style={{
          opacity: 0,
          transform: `translate3d(0, ${MAX_OFFSET}px, 0)`,
        }}
      >
        <Image
          src="/footer-bears.png"
          alt=""
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>
    </div>
  );
}
