import Image from "next/image";
import Link from "next/link";
import { CartCountBadge } from "@/components/CartCountBadge";
import { CartPreview } from "@/components/CartPreview";
import { MobileNav } from "./MobileNav";

function IconBag() {
  return (
    <svg
      className="h-6 w-6 text-heading"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.25}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 8V6a4 4 0 118 0v2m-11 3v10a2 2 0 002 2h12a2 2 0 002-2V11"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <MobileNav />
          <nav className="hidden items-center gap-8 font-sans text-sm font-medium uppercase tracking-wide text-heading lg:flex">
            <Link href="/shop" className="hover:text-dusty-rose">
              Shop
            </Link>
            <Link href="/collections" className="hover:text-dusty-rose">
              Collections
            </Link>
          </nav>
        </div>

        <Link
          href="/"
          className="relative flex shrink-0 items-center justify-center outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose"
        >
          <Image
            src="/Studio-Amrita-Logo.png"
            alt="Studio Amrita — gold wordmark with a pink and gold heart"
            width={1024}
            height={346}
            className="h-9 w-auto max-w-[min(100%,300px)] sm:h-10 sm:max-w-[360px] md:h-12 md:max-w-[400px] lg:h-14 lg:max-w-[min(100%,480px)]"
            priority
            sizes="(max-width: 640px) 300px, (max-width: 1024px) 400px, 480px"
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
          <nav className="hidden items-center gap-8 font-sans text-sm font-medium uppercase tracking-wide text-heading lg:flex">
            <Link href="/about" className="hover:text-dusty-rose">
              About
            </Link>
            <Link href="/faq" className="hover:text-dusty-rose">
              FAQ
            </Link>
          </nav>
          <CartPreview>
            <Link
              href="/cart"
              className="relative block rounded-full p-1 text-heading hover:bg-blush/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose"
              aria-label="Shopping bag"
            >
              <IconBag />
              <CartCountBadge />
            </Link>
          </CartPreview>
        </div>
      </div>
    </header>
  );
}
