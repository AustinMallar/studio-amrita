"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  productId: number;
  /** Set for variable products (parent ID + variation database ID). Omit for simple products. */
  variationId?: number;
  quantity?: number;
  label?: string;
  disabled?: boolean;
};

export function AddToCartButton({
  productId,
  variationId,
  quantity = 1,
  label = "Add to cart ♡",
  disabled,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const variableMode = variationId !== undefined;
  const vid = variableMode ? Number(variationId) : null;

  const canSubmit =
    !disabled &&
    Number.isFinite(productId) &&
    productId > 0 &&
    (!variableMode || (Number.isFinite(vid) && vid != null && vid > 0));

  async function handleClick() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          quantity,
          ...(variableMode && Number.isFinite(vid) && vid != null && vid > 0 ? { variationId: vid } : {}),
        }),
      });
      const payload = (await res.json()) as {
        errors?: Array<{ message?: string }>;
        data?: unknown;
        error?: string;
      };

      if (!res.ok) {
        setMessage(payload.error ?? "Could not add to cart");
        return;
      }
      if (payload.errors?.length) {
        setMessage(payload.errors.map((e) => e.message).filter(Boolean).join(", ") || "Error");
        return;
      }

      setMessage("Added to cart");
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!canSubmit || loading}
        className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Adding…" : label}
      </button>
      {message ? (
        <p className="font-sans text-sm text-body" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
