"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra transition delay for staggered sequences (ms). */
  delayMs?: number;
  /** Passed to IntersectionObserver — negative bottom margin triggers earlier. */
  rootMargin?: string;
  /** Remove observer after first reveal (default true). */
  once?: boolean;
};

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  rootMargin = "0px 0px -8% 0px",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, once]);

  const style: CSSProperties | undefined =
    delayMs > 0
      ? ({ "--scroll-reveal-delay": `${delayMs}ms` } as CSSProperties)
      : undefined;

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "scroll-reveal-visible" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
