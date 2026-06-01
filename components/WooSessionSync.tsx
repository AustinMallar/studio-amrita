"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * When WP returns a refreshed `woocommerce-session` during RSC, Next.js cannot set cookies on the
 * cart/checkout page render. Ping /api/cart (which can set cookies) then refresh so SSR sees the
 * updated session.
 */
export function WooSessionSync({ active }: { active: boolean }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    fetch("/api/cart", { credentials: "include", cache: "no-store" })
      .then(() => router.refresh())
      .catch(() => {
        started.current = false;
      });
  }, [active, router]);

  return null;
}
