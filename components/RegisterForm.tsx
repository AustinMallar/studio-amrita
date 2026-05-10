"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-black/[0.08] bg-white/80 px-4 py-3 font-sans text-sm text-heading outline-none placeholder:text-body/70 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/35";

const btnClass =
  "inline-flex w-full items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 disabled:cursor-not-allowed disabled:opacity-50";

export function RegisterForm({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push(nextHref);
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-1">
          <label htmlFor="reg-first" className="text-sm font-medium text-heading">
            First name
          </label>
          <input
            id="reg-first"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-1">
          <label htmlFor="reg-last" className="text-sm font-medium text-heading">
            Last name
          </label>
          <input
            id="reg-last"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reg-username" className="text-sm font-medium text-heading">
          Username
        </label>
        <input
          id="reg-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reg-email" className="text-sm font-medium text-heading">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reg-password" className="text-sm font-medium text-heading">
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-body">At least 8 characters.</p>
      </div>

      <button type="submit" disabled={pending} className={btnClass}>
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-body">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-dusty-rose hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
