"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CartLineThumb } from "@/components/CartLineThumb";
import { RemoveFromCartButton } from "@/components/RemoveFromCartButton";
import { useCart } from "@/components/CartProvider";

export function CartPreview({ children }: { children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { previewLines, previewTotal, loading, ensurePreviewFresh } = useCart();

  useEffect(() => {
    function onCartUpdated() {
      setFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setFlash(false);
        flashTimerRef.current = null;
      }, 6000);
    }

    window.addEventListener("cart:updated", onCartUpdated);
    return () => {
      window.removeEventListener("cart:updated", onCartUpdated);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  async function handleMouseEnter() {
    setHover(true);
    await ensurePreviewFresh();
  }

  const showLoading = loading && previewLines.length === 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover || flash ? (
        <div
          className="absolute right-0 top-full z-50 min-w-[17rem] max-w-[min(calc(100vw-2rem),22rem)] pt-2"
          role="dialog"
          aria-label="Cart preview"
        >
          <div className="rounded-2xl border border-black/[0.08] bg-cream shadow-[0_8px_30px_rgba(92,77,77,0.14)]">
            <div className="border-b border-black/[0.06] px-4 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-heading">
              Your cart
            </div>
            <div className="max-h-[22rem] overflow-y-auto px-4 py-3">
              {showLoading ? (
                <p className="font-sans text-sm text-body">Loading…</p>
              ) : previewLines.length === 0 ? (
                <p className="font-sans text-sm text-body">Your cart is empty.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {previewLines.map((line, index) => (
                    <li
                      key={line.key ?? `${line.name}-${index}`}
                      className="flex items-start gap-2 font-sans text-sm"
                    >
                      <CartLineThumb
                        imageUrl={line.imageUrl}
                        imageAlt={line.imageAlt}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="leading-snug text-heading">{line.name}</p>
                        <p className="mt-0.5 tabular-nums text-body">
                          ×{line.quantity ?? 0}
                          {line.subtotal ? (
                            <span className="ml-2 text-heading/80">{line.subtotal}</span>
                          ) : null}
                        </p>
                      </div>
                      {line.key ? (
                        <RemoveFromCartButton cartKey={line.key} compact />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {previewTotal && previewLines.length > 0 ? (
              <div className="border-t border-black/[0.06] px-4 py-2 font-sans text-sm">
                <span className="text-body">Total </span>
                <span className="font-semibold text-heading">{previewTotal}</span>
              </div>
            ) : null}
            <div className="border-t border-black/[0.06] p-3">
              <Link
                href="/cart"
                className="block w-full rounded-full bg-dusty-rose py-2.5 text-center font-sans text-sm font-semibold text-white transition hover:bg-dusty-rose/90"
                onClick={() => setFlash(false)}
              >
                View cart
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
