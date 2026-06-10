"use client";

import { acctInputClass } from "@/components/account/account-form-classes";
import type { AppliedCoupon } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  appliedCoupons: AppliedCoupon[];
};

export function CartCouponForm({ appliedCoupons }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coupons = appliedCoupons.filter((c) => c.code?.trim());

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not apply coupon");
        return;
      }
      setCode("");
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    } catch {
      setError("Could not apply coupon");
    } finally {
      setPending(false);
    }
  }

  async function removeCoupon(couponCode: string) {
    if (removingCode || pending) return;

    setRemovingCode(couponCode);
    setError(null);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not remove coupon");
        return;
      }
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    } catch {
      setError("Could not remove coupon");
    } finally {
      setRemovingCode(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/50 px-4 py-4">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-body">
        Coupon code
      </p>

      {coupons.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {coupons.map((coupon) => {
            const couponCode = coupon.code!.trim();
            const discount = coupon.discountAmount?.trim();
            const isRemoving = removingCode === couponCode;
            return (
              <li
                key={couponCode}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-cream/80 px-3 py-2.5 font-sans text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium text-heading">{couponCode}</span>
                  {discount ? (
                    <span className="ml-2 text-body">−{discount}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeCoupon(couponCode)}
                  disabled={pending || isRemoving}
                  className="shrink-0 font-sans text-xs font-semibold uppercase tracking-wide text-dusty-rose transition hover:text-dusty-rose/80 disabled:opacity-50"
                >
                  {isRemoving ? "Removing…" : "Remove"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form onSubmit={applyCoupon} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter coupon code"
          disabled={pending}
          autoComplete="off"
          className={`${acctInputClass} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="shrink-0 rounded-full border border-dusty-rose/40 bg-white px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-dusty-rose transition hover:bg-dusty-rose/5 disabled:opacity-50"
        >
          {pending ? "Applying…" : "Apply"}
        </button>
      </form>

      {error ? (
        <p className="mt-2 font-sans text-sm text-dusty-rose" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
