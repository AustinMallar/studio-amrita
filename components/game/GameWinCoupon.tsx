"use client";

import { BERRY_BUMP_WIN_COUPON } from "@/lib/game/constants";
import Link from "next/link";
import { useCallback, useState } from "react";

export function GameWinCoupon() {
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BERRY_BUMP_WIN_COUPON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — code remains visible to copy manually */
    }
  }, []);

  async function applyToCart() {
    if (applying || applied) return;

    setApplying(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: BERRY_BUMP_WIN_COUPON }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setApplyError(json.error ?? "Could not apply coupon");
        return;
      }
      setApplied(true);
      window.dispatchEvent(new Event("cart:updated"));
    } catch {
      setApplyError("Could not apply coupon");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border-2 border-dusty-rose/35 bg-gradient-to-b from-blush/60 to-cream/90 px-5 py-5 text-center shadow-sm">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-dusty-rose">
        Your reward
      </p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-body">
        You beat Berry Bump! Use this code at checkout for your reward.
      </p>

      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div className="inline-flex select-none items-center gap-3 rounded-full border border-dusty-rose/25 bg-white/80 px-5 py-2.5 shadow-sm">
          <span
            className="font-mono text-2xl font-bold tracking-[0.2em] text-heading"
            aria-label={`Coupon code ${BERRY_BUMP_WIN_COUPON}`}
          >
            {BERRY_BUMP_WIN_COUPON}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="select-none touch-manipulation rounded-full border border-dusty-rose/30 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-dusty-rose transition hover:bg-dusty-rose/5"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {applied ? (
          <Link
            href="/cart"
            className="inline-flex select-none touch-manipulation items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
          >
            View cart ♡
          </Link>
        ) : (
          <button
            type="button"
            onClick={applyToCart}
            disabled={applying}
            className="inline-flex select-none touch-manipulation items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply to cart"}
          </button>
        )}
        <Link
          href="/shop"
          className="inline-flex select-none touch-manipulation items-center justify-center rounded-full border border-dusty-rose/40 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-heading transition hover:border-dusty-rose hover:text-dusty-rose"
        >
          Shop now
        </Link>
      </div>

      {applyError ? (
        <p className="mt-3 font-sans text-sm text-dusty-rose" role="alert">
          {applyError}. You can still enter {BERRY_BUMP_WIN_COUPON} at checkout.
        </p>
      ) : applied ? (
        <p className="mt-3 font-sans text-sm text-body">
          {BERRY_BUMP_WIN_COUPON} is on your cart — happy shopping!
        </p>
      ) : (
        <p className="mt-3 font-sans text-xs text-body/80">
          One use per customer. Enter at checkout if you shop later.
        </p>
      )}
    </div>
  );
}
