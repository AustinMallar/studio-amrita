"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { CustomerAddress } from "@/lib/account-data";

import {
  acctBtnPrimaryClass,
  acctInputClass,
  acctLabelClass,
  acctSelectClass,
} from "@/components/account/account-form-classes";
import { getCountryOptions, getRegionOptions } from "@/lib/country-region-options";

function emptyAddr(): Record<string, string> {
  return {
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "CA",
    email: "",
    phone: "",
  };
}

function addrToState(a: CustomerAddress | null | undefined): Record<string, string> {
  const e = emptyAddr();
  if (!a) return e;
  return {
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    company: a.company ?? "",
    address1: a.address1 ?? "",
    address2: a.address2 ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    postcode: a.postcode ?? "",
    country: (a.country ?? "").trim() || "CA",
    email: a.email ?? "",
    phone: a.phone ?? "",
  };
}

function stripEmpty(o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const t = v.trim();
    if (t) out[k] = t;
  }
  return out;
}

function validateCountryState(label: string, addr: Record<string, string>): string | null {
  if (!addr.country.trim()) return `Select a country (${label}).`;
  if (!addr.state.trim()) {
    const regs = getRegionOptions(addr.country);
    return regs.length > 0
      ? `Select a province or state (${label}).`
      : `Enter your state or province (${label}).`;
  }
  return null;
}

type Props = {
  initialBilling: CustomerAddress | null | undefined;
  initialShipping: CustomerAddress | null | undefined;
  /** Account email — billing email field is hidden and this value is sent when saving. */
  accountEmail?: string | null;
};

export function BillingShippingForms({
  initialBilling,
  initialShipping,
  accountEmail,
}: Props) {
  const router = useRouter();
  const [billing, setBilling] = useState(() => addrToState(initialBilling));
  const [shipping, setShipping] = useState(() => addrToState(initialShipping));
  const [sameAs, setSameAs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(), []);
  const billingRegions = useMemo(() => getRegionOptions(billing.country), [billing.country]);
  const shippingRegions = useMemo(() => getRegionOptions(shipping.country), [shipping.country]);

  const billingKey = JSON.stringify(initialBilling ?? null);
  const shippingKey = JSON.stringify(initialShipping ?? null);

  useEffect(() => {
    const nextBilling = addrToState(JSON.parse(billingKey) as CustomerAddress | null);
    const nextShipping = addrToState(JSON.parse(shippingKey) as CustomerAddress | null);
    queueMicrotask(() => {
      setBilling(nextBilling);
      setShipping(nextShipping);
    });
  }, [billingKey, shippingKey]);

  function setBill<K extends keyof ReturnType<typeof emptyAddr>>(key: K, value: string) {
    setBilling((prev) => ({ ...prev, [key]: value }));
  }
  function setShip<K extends keyof ReturnType<typeof emptyAddr>>(key: K, value: string) {
    setShipping((prev) => ({ ...prev, [key]: value }));
  }

  function setBillCountry(code: string) {
    setBilling((prev) => ({ ...prev, country: code, state: "" }));
  }
  function setShipCountry(code: string) {
    setShipping((prev) => ({ ...prev, country: code, state: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const emailResolved =
      (accountEmail?.trim() || billing.email.trim()) || "";
    if (!emailResolved) {
      setError("Email is required on the billing address.");
      return;
    }

    const billingForValidation = { ...billing, email: emailResolved };
    const billErr = validateCountryState("billing", billingForValidation);
    if (billErr) {
      setError(billErr);
      return;
    }

    if (!sameAs) {
      const shipErr = validateCountryState("shipping", shipping);
      if (shipErr) {
        setError(shipErr);
        return;
      }
    }

    setPending(true);

    const billingPayload = { ...billing, email: emailResolved };

    const body: Record<string, unknown> = {
      billing: stripEmpty(billingPayload),
      shippingSameAsBilling: sameAs,
    };
    if (!sameAs) {
      const ship = { ...stripEmpty(shipping) };
      delete ship.email;
      body.shipping = ship;
    }

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save addresses.");
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
    <form onSubmit={onSubmit} className="flex flex-col gap-10 font-sans">
      {error ? (
        <p className="rounded-xl border border-dusty-rose/40 bg-white/70 px-4 py-3 text-sm text-heading" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-body" role="status">
          Addresses saved.
        </p>
      ) : null}

      <div className="space-y-4">
        <h3 className="font-heading text-lg text-heading">Billing address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" id="bill-fn" autoComplete="given-name" value={billing.firstName} onChange={(v) => setBill("firstName", v)} />
          <Field label="Last name" id="bill-ln" autoComplete="family-name" value={billing.lastName} onChange={(v) => setBill("lastName", v)} />
        </div>
        <Field label="Company (optional)" id="bill-co" value={billing.company} onChange={(v) => setBill("company", v)} />
        <Field label="Address line 1" id="bill-a1" autoComplete="address-line1" value={billing.address1} onChange={(v) => setBill("address1", v)} />
        <Field label="Address line 2" id="bill-a2" autoComplete="address-line2" value={billing.address2} onChange={(v) => setBill("address2", v)} />

        <div className="flex flex-col gap-2">
          <label htmlFor="bill-country" className={acctLabelClass}>
            Country
          </label>
          <select
            id="bill-country"
            value={billing.country}
            disabled={pending}
            onChange={(e) => setBillCountry(e.target.value)}
            autoComplete="country"
            className={acctSelectClass}
          >
            <option value="">Select a country</option>
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" id="bill-city" autoComplete="address-level2" value={billing.city} onChange={(v) => setBill("city", v)} />
          {billingRegions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="bill-state" className={acctLabelClass}>
                Province / State
              </label>
              <select
                id="bill-state"
                value={billing.state}
                disabled={pending}
                onChange={(e) => setBill("state", e.target.value)}
                autoComplete="address-level1"
                className={acctSelectClass}
              >
                <option value="">Select province or state</option>
                {billingRegions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Field
              label="State / Province / Region"
              id="bill-state"
              autoComplete="address-level1"
              value={billing.state}
              onChange={(v) => setBill("state", v)}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Postal code"
            id="bill-zip"
            autoComplete="postal-code"
            value={billing.postcode}
            onChange={(v) => setBill("postcode", v)}
          />
          <Field label="Phone" id="bill-phone" type="tel" autoComplete="tel" value={billing.phone} onChange={(v) => setBill("phone", v)} />
        </div>

        {accountEmail?.trim() ? (
          <div className="rounded-xl border border-black/[0.08] bg-cream/80 px-4 py-3 font-sans text-sm text-heading">
            <span className="text-body">Email </span>
            <span className="font-medium">{accountEmail.trim()}</span>
          </div>
        ) : (
          <Field
            label="Email"
            id="bill-email"
            type="email"
            autoComplete="email"
            value={billing.email}
            onChange={(v) => setBill("email", v)}
          />
        )}
      </div>

      <div className="border-t border-black/[0.06] pt-8">
        <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-heading">
          <input
            type="checkbox"
            checked={sameAs}
            onChange={(e) => setSameAs(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/[0.2] text-dusty-rose focus:ring-dusty-rose"
          />
          <span>Shipping address is the same as billing</span>
        </label>
      </div>

      {!sameAs ? (
        <div className="space-y-4">
          <h3 className="font-heading text-lg text-heading">Shipping address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" id="ship-fn" value={shipping.firstName} onChange={(v) => setShip("firstName", v)} />
            <Field label="Last name" id="ship-ln" value={shipping.lastName} onChange={(v) => setShip("lastName", v)} />
          </div>
          <Field label="Company (optional)" id="ship-co" value={shipping.company} onChange={(v) => setShip("company", v)} />
          <Field label="Address line 1" id="ship-a1" value={shipping.address1} onChange={(v) => setShip("address1", v)} />
          <Field label="Address line 2" id="ship-a2" value={shipping.address2} onChange={(v) => setShip("address2", v)} />

          <div className="flex flex-col gap-2">
            <label htmlFor="ship-country" className={acctLabelClass}>
              Country
            </label>
            <select
              id="ship-country"
              value={shipping.country}
              disabled={pending}
              onChange={(e) => setShipCountry(e.target.value)}
              autoComplete="shipping country"
              className={acctSelectClass}
            >
              <option value="">Select a country</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" id="ship-city" autoComplete="address-level2" value={shipping.city} onChange={(v) => setShip("city", v)} />
            {shippingRegions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="ship-state" className={acctLabelClass}>
                  Province / State
                </label>
                <select
                  id="ship-state"
                  value={shipping.state}
                  disabled={pending}
                  onChange={(e) => setShip("state", e.target.value)}
                  autoComplete="address-level1"
                  className={acctSelectClass}
                >
                  <option value="">Select province or state</option>
                  {shippingRegions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Field
                label="State / Province / Region"
                id="ship-state"
                autoComplete="address-level1"
                value={shipping.state}
                onChange={(v) => setShip("state", v)}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Postal code"
              id="ship-zip"
              autoComplete="shipping postal-code"
              value={shipping.postcode}
              onChange={(v) => setShip("postcode", v)}
            />
            <Field label="Phone" id="ship-phone" type="tel" autoComplete="tel" value={shipping.phone} onChange={(v) => setShip("phone", v)} />
          </div>
        </div>
      ) : null}

      <button type="submit" disabled={pending} className={`${acctBtnPrimaryClass} w-full sm:w-auto`}>
        {pending ? "Saving…" : "Save addresses"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={acctLabelClass}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={acctInputClass}
      />
      {hint ? <p className="text-xs text-body">{hint}</p> : null}
    </div>
  );
}
