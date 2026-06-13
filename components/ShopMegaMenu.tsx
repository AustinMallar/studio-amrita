"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ShopMegaMenuTile } from "@/lib/shop-mega-menu-types";

const CLOSE_MS = 140;

export function ShopMegaMenu({ collections }: { collections: ShopMegaMenuTile[] }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_MS);
  }, [cancelClose]);

  const openMenu = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 py-1 font-sans text-sm font-medium uppercase tracking-wide text-heading hover:text-dusty-rose"
      >
        Shop
        <span aria-hidden className="text-[0.65rem] leading-none opacity-60">
          ▾
        </span>
      </Link>

      {/* Anchor to Shop’s left edge — avoids wide panel clipping off the viewport when centered */}
      <div
        className={`absolute left-0 top-full z-50 pt-3 transition duration-150 ease-out motion-reduce:transition-none ${
          open
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
        style={{ width: "min(42rem, calc(100vw - 2rem))" }}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        role="region"
        aria-label="Shop collections"
        aria-hidden={!open}
      >
        <div className="rounded-2xl border border-black/[0.08] bg-cream/98 p-3 shadow-[0_14px_44px_rgba(92,77,77,0.14)] backdrop-blur-md">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {collections.map((c) => (
              <li key={c.href} className="min-w-0">
                <Link
                  href={c.href}
                  className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white/65 transition hover:border-dusty-rose/45 hover:bg-blush/50 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-blush/35">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 200px, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center font-sans text-[0.65rem] uppercase tracking-wide text-body">
                        {c.label}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-2 py-3 text-center">
                    <span className="font-heading text-[0.8rem] font-semibold leading-snug text-heading group-hover:text-dusty-rose sm:text-[0.85rem]">
                      {c.label}
                    </span>
                    <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-body">
                      View
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
