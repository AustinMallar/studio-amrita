"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-black/[0.08] bg-white/80 px-4 py-3 font-sans text-sm text-heading outline-none placeholder:text-body/70 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/35";

const btnClass =
  "inline-flex w-full items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  keyValue: string;
  loginValue: string;
};

export function ResetPasswordForm({ keyValue, loginValue }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyValue, login: loginValue, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }
      router.push("/login?reset=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 font-sans">
      {error ? (
        <p
          className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3 text-sm text-heading"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="reset-password" className="text-sm font-medium text-heading">
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reset-confirm" className="text-sm font-medium text-heading">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={btnClass}>
        {pending ? "Updating…" : "Set new password"}
      </button>

      <p className="text-center text-sm text-body">
        <Link href="/forgot-password" className="font-medium text-dusty-rose hover:underline">
          Request a new link
        </Link>
        {" · "}
        <Link href="/login" className="font-medium text-dusty-rose hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
