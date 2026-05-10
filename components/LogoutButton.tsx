"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const btnClass =
  "inline-flex items-center justify-center rounded-full border border-black/[0.12] bg-white/70 px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-heading transition hover:bg-blush/80 disabled:cursor-not-allowed disabled:opacity-50";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className={btnClass} disabled={pending} onClick={logout}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
