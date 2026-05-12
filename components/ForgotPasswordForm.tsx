"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-black/[0.08] bg-white/80 px-4 py-3 font-sans text-sm text-heading outline-none placeholder:text-body/70 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/35";

const btnClass =
  "inline-flex w-full items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 disabled:cursor-not-allowed disabled:opacity-50";

export function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccess(data.message ?? "Check your email for reset instructions.");
      setUsername("");
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
      {success ? (
        <p className="rounded-2xl border border-black/[0.08] bg-white/60 px-4 py-3 text-sm text-heading">
          {success}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="forgot-username" className="text-sm font-medium text-heading">
          Username or email
        </label>
        <input
          id="forgot-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={btnClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-body">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-dusty-rose hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
