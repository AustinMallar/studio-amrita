"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  acctBtnPrimaryClass,
  acctInputClass,
  acctLabelClass,
} from "@/components/account/account-form-classes";

type Props = {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
};

export function ProfileDetailsForm({ initialFirstName, initialLastName, initialEmail }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setPending(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 font-sans">
      {error ? (
        <p className="rounded-xl border border-dusty-rose/40 bg-white/70 px-4 py-3 text-sm text-heading" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-body" role="status">
          Profile saved.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-first" className={acctLabelClass}>
            First name
          </label>
          <input
            id="profile-first"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={acctInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-last" className={acctLabelClass}>
            Last name
          </label>
          <input
            id="profile-last"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={acctInputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-email" className={acctLabelClass}>
          Email
        </label>
        <input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={acctInputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={`${acctBtnPrimaryClass} w-full sm:w-auto`}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
