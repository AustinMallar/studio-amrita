"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cheapestFlatRate,
  formatShippingCostForDisplay,
  type FlatShippingRate,
} from "@/lib/cart-shipping-utils";

type Props = {
  rates: FlatShippingRate[];
  chosenShippingMethods: string[] | null | undefined;
};

export function CartShippingSelector({ rates, chosenShippingMethods }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSelectAttempted = useRef(false);

  const chosenList = chosenShippingMethods ?? [];
  const selectedFromSession = rates.find((r) => chosenList.includes(r.id))?.id ?? null;
  const cheapest = useMemo(() => cheapestFlatRate(rates), [rates]);

  const selectRate = useCallback(
    async (rateId: string) => {
      if (pending) return;
      if (chosenList.includes(rateId)) return;

      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/cart/shipping-method", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingMethods: [rateId] }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(json.error ?? "Could not update shipping");
          return;
        }
        window.dispatchEvent(new Event("cart:updated"));
        router.refresh();
      } catch {
        setError("Could not update shipping");
      } finally {
        setPending(false);
      }
    },
    [chosenList, pending, router]
  );

  useEffect(() => {
    if (autoSelectAttempted.current || pending || rates.length === 0) return;
    const hasValidChoice = rates.some((r) => chosenList.includes(r.id));
    if (hasValidChoice || !cheapest) return;
    autoSelectAttempted.current = true;
    void selectRate(cheapest.id);
  }, [rates, chosenList, cheapest, pending, selectRate]);

  if (rates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/50 px-4 py-4">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-body">
        Shipping method
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {rates.map((r) => {
          const checked =
            selectedFromSession === r.id ||
            (selectedFromSession == null && rates.length === 1 && r.id === rates[0].id);
          return (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[0.06] bg-cream/80 px-3 py-3 font-sans text-sm transition hover:border-dusty-rose/40 has-[:checked]:border-dusty-rose/50 has-[:checked]:bg-white">
                <input
                  type="radio"
                  name="cart-shipping-rate"
                  value={r.id}
                  checked={checked}
                  disabled={pending}
                  onChange={() => selectRate(r.id)}
                  className="h-4 w-4 shrink-0 accent-dusty-rose"
                />
                <span className="min-w-0 flex-1 leading-snug text-heading">{r.label}</span>
                <span className="shrink-0 tabular-nums text-body">
                  {formatShippingCostForDisplay(r.cost)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="mt-2 font-sans text-sm text-dusty-rose" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
