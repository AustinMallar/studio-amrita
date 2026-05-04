"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  cartKey: string;
  /** Smaller label for mini cart dropdown */
  compact?: boolean;
};

export function RemoveFromCartButton({ cartKey, compact }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    const key = cartKey.trim();
    if (!key || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not remove item");
        return;
      }
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    } catch {
      setError("Could not remove item");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "shrink-0" : "flex flex-col items-end gap-0.5"}>
      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className={`text-left font-sans text-dusty-rose underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? "whitespace-nowrap text-xs" : "text-sm"
        }`}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error ? (
        <p className={`text-dusty-rose ${compact ? "max-w-[7rem] text-[10px] leading-tight" : "max-w-xs text-xs"}`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
