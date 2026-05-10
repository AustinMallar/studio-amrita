"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  acctBtnPrimaryClass,
  acctInputClass,
  acctLabelClass,
} from "@/components/account/account-form-classes";

export function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update password.");
        return;
      }
      setPassword("");
      setConfirm("");
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
          Password updated.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className={acctLabelClass}>
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={acctInputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className={acctLabelClass}>
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={acctInputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={`${acctBtnPrimaryClass} w-full sm:w-auto`}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
