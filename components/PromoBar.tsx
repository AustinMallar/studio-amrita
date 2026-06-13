import Link from "next/link";
import { SHIPPING_COPY } from "@/lib/shipping";

export function PromoBar() {
  return (
    <div className="bg-dusty-rose py-2 text-center text-sm font-medium tracking-wide text-white">
      <Link href="/shop" className="inline-flex items-center justify-center gap-1 hover:underline">
        {SHIPPING_COPY.promoBar}
      </Link>
    </div>
  );
}
