"use client";

import { useCart } from "@/components/CartProvider";

export function CartCountBadge() {
  const { itemCount } = useCart();

  if (itemCount <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dusty-rose px-1 font-sans text-[10px] font-bold leading-none text-white">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}
