"use client";

import type { ShopMegaMenuTile } from "@/lib/shop-mega-menu-types";
import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const DRAWER_MS = 320;

type DrawerLink = {
  href: string;
  label: string;
  indent?: boolean;
  imageUrl?: string | null;
  imageAlt?: string;
};

function buildDrawerLinks(collections: ShopMegaMenuTile[]): DrawerLink[] {
  return [
    { href: "/shop", label: "Shop" },
    ...collections.map((c) => ({
      href: c.href,
      label: c.label,
      indent: true as const,
      imageUrl: c.imageUrl,
      imageAlt: c.imageAlt,
    })),
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "mailto:shop@studioamrita.ca", label: "Contact" },
  ];
}

function subscribePrefersReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

function IconClose() {
  return (
    <svg
      className="h-6 w-6 text-heading"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.25}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MobileNav({
  shopCollections,
  signedIn = false,
}: {
  shopCollections: ShopMegaMenuTile[];
  signedIn?: boolean;
}) {
  const drawerLinks = useMemo(() => buildDrawerLinks(shopCollections), [shopCollections]);

  const [visible, setVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** True while the drawer is performing its close animation (or waiting to unmount). */
  const closingRef = useRef(false);
  const closeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduceMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false
  );

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      queueMicrotask(() => setDrawerOpen(true));
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerOpen(true));
    });
    return () => cancelAnimationFrame(id);
  }, [visible, reduceMotion]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      if (closeFallbackTimerRef.current) {
        clearTimeout(closeFallbackTimerRef.current);
      }
    };
  }, []);

  const clearCloseFallback = useCallback(() => {
    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    closingRef.current = false;
    clearCloseFallback();
    setVisible(true);
  }, [clearCloseFallback]);

  const finishClose = useCallback(() => {
    clearCloseFallback();
    closingRef.current = false;
    setVisible(false);
  }, [clearCloseFallback]);

  const requestClose = useCallback(() => {
    closingRef.current = true;
    setDrawerOpen(false);
    clearCloseFallback();
    closeFallbackTimerRef.current = setTimeout(() => {
      closeFallbackTimerRef.current = null;
      if (closingRef.current) {
        finishClose();
      }
    }, DRAWER_MS + 120);
  }, [clearCloseFallback, finishClose]);

  function onDrawerTransitionEnd(e: React.TransitionEvent<HTMLElement>) {
    if (e.propertyName !== "transform") return;
    if (!closingRef.current) return;
    finishClose();
  }

  const panelOpen = drawerOpen;
  /** X only while the sheet is open — avoids stuck icon when `visible` lingers without `transitionend`. */
  const showCloseInHeader = visible && drawerOpen;

  return (
    <>
      <button
        type="button"
        className="rounded-full p-1 text-heading hover:bg-blush/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose lg:hidden"
        aria-label={showCloseInHeader ? "Close menu" : "Open menu"}
        aria-expanded={panelOpen}
        onClick={() => {
          if (visible && drawerOpen) {
            requestClose();
          } else if (visible && !drawerOpen) {
            clearCloseFallback();
            closingRef.current = false;
            finishClose();
          } else if (!visible) {
            openMenu();
          }
        }}
      >
        {showCloseInHeader ? <IconClose /> : <IconMenu />}
      </button>

      {visible
        ? createPortal(
            <div className="fixed inset-0 z-50 min-h-[100dvh] lg:hidden" role="presentation">
              <button
                type="button"
                className={`absolute inset-0 min-h-[100dvh] bg-black/45 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                  drawerOpen ? "opacity-100" : "opacity-0"
                }`}
                aria-label="Close menu"
                onClick={requestClose}
              />
              <nav
                className={`absolute inset-y-0 left-0 z-10 flex w-[min(20rem,88vw)] max-w-full flex-col rounded-br-2xl border-r border-black/[0.06] bg-cream shadow-[4px_0_28px_rgba(92,77,77,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none motion-reduce:duration-100 ${
                  drawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-label="Mobile navigation"
                onTransitionEnd={onDrawerTransitionEnd}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-5 py-4">
                  <p
                    className={`font-display text-lg tracking-[0.2em] text-heading transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                      panelOpen && !reduceMotion
                        ? "translate-x-0 opacity-100"
                        : reduceMotion && panelOpen
                          ? "opacity-100"
                          : "-translate-x-2 opacity-0"
                    }`}
                    style={
                      !reduceMotion
                        ? { transitionDelay: panelOpen ? "40ms" : "0ms" }
                        : undefined
                    }
                  >
                    MENU
                  </p>
                  <button
                    type="button"
                    className="-mr-1 rounded-full p-2 text-heading hover:bg-blush/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose"
                    aria-label="Close menu"
                    onClick={requestClose}
                  >
                    <IconClose />
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-10 pt-4">
                  {drawerLinks.map(({ href, label, indent, imageUrl, imageAlt }, i) => {
                    const delayMs = reduceMotion ? 0 : 85 + i * 48;
                    return (
                      <Link
                        key={`${href}-${label}`}
                        href={href}
                        onClick={requestClose}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 font-sans text-sm font-medium text-heading transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-150 hover:bg-blush/45 hover:text-dusty-rose ${
                          indent
                            ? "pl-4 text-[0.8125rem] font-normal normal-case tracking-normal text-body"
                            : "uppercase tracking-[0.18em]"
                        } ${
                          panelOpen && !reduceMotion
                            ? "translate-x-0 opacity-100"
                            : reduceMotion && panelOpen
                              ? "opacity-100"
                              : "-translate-x-3 opacity-0"
                        }`}
                        style={
                          !reduceMotion
                            ? {
                                transitionDelay: panelOpen ? `${delayMs}ms` : "0ms",
                              }
                            : undefined
                        }
                      >
                        {indent && imageUrl ? (
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-blush/40">
                            <Image
                              src={imageUrl}
                              alt={imageAlt ?? label}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">{label}</span>
                      </Link>
                    );
                  })}
                  <div
                    className={`mt-4 border-t border-black/[0.06] pt-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      panelOpen && !reduceMotion
                        ? "translate-x-0 opacity-100"
                        : reduceMotion && panelOpen
                          ? "opacity-100"
                          : "-translate-x-3 opacity-0"
                    }`}
                    style={
                      !reduceMotion
                        ? {
                            transitionDelay: panelOpen
                              ? `${85 + drawerLinks.length * 48}ms`
                              : "0ms",
                          }
                        : undefined
                    }
                  >
                    {signedIn ? (
                      <Link
                        href="/account"
                        onClick={requestClose}
                        className="block rounded-xl px-3 py-3.5 font-sans text-sm font-medium uppercase tracking-[0.18em] text-heading hover:bg-blush/45 hover:text-dusty-rose"
                      >
                        Account
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={requestClose}
                        className="block rounded-xl px-3 py-3.5 font-sans text-sm font-medium uppercase tracking-[0.18em] text-heading hover:bg-blush/45 hover:text-dusty-rose"
                      >
                        Sign in
                      </Link>
                    )}
                    <div className="mt-4 flex flex-col items-start gap-3 px-3">
                      <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-body">
                        Follow us
                      </p>
                      <SocialLinks size="sm" />
                    </div>
                  </div>
                </div>
              </nav>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
