"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function IconMenu() {
  return (
    <svg
      className="h-6 w-6 text-heading"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.25}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="rounded-full p-1 text-heading hover:bg-blush/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <IconMenu />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="absolute left-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col gap-6 bg-cream p-6 shadow-xl"
            aria-label="Mobile"
          >
            <p className="font-display text-lg tracking-[0.2em] text-heading">MENU</p>
            <div className="flex flex-col gap-4 font-sans text-sm font-medium uppercase tracking-wide text-heading">
              <Link href="/shop" onClick={() => setOpen(false)} className="hover:text-dusty-rose">
                Shop
              </Link>
              <Link href="/collections" onClick={() => setOpen(false)} className="hover:text-dusty-rose">
                Collections
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className="hover:text-dusty-rose">
                About
              </Link>
              <Link href="/faq" onClick={() => setOpen(false)} className="hover:text-dusty-rose">
                FAQ
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
