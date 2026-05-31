"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function isInternalNavigation(anchor: HTMLAnchorElement, pathname: string): boolean {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const next = `${url.pathname}${url.search}`;
    const current = `${pathname}${window.location.search}`;
    return next !== current;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigation(anchor, pathname)) return;
      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-dusty-rose/25"
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="nav-progress-bar h-full w-1/3 bg-dusty-rose" />
    </div>
  );
}
