import Link from "next/link";

export function PromoBar() {
  return (
    <div className="bg-dusty-rose py-2 text-center text-sm font-medium tracking-wide text-white">
      <Link href="/shop" className="inline-flex items-center justify-center gap-1 hover:underline">
        Free shipping on orders over $50 — Shop now ♡
      </Link>
    </div>
  );
}
