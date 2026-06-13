import { SHIPPING_COPY } from "@/lib/shipping";

export function ProductShippingCallout() {
  return (
    <p className="rounded-2xl border border-dusty-rose/25 bg-white/60 px-4 py-3 font-sans text-sm leading-relaxed text-body">
      {SHIPPING_COPY.pdpCallout}
    </p>
  );
}
