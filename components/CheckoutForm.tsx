"use client";

import { useMemo, useState } from "react";

import {
  acctBtnPrimaryClass,
  acctInputClass,
  acctLabelClass,
  acctSelectClass,
} from "@/components/account/account-form-classes";
import { formatShippingCostForDisplay, type FlatShippingRate } from "@/lib/cart-shipping-utils";
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

type Props = {
  flatRates: FlatShippingRate[];
  chosenShippingMethods: string[] | null | undefined;
  cartSummary: {
    subtotal: string | null;
    shipping: string | null;
    discount: string | null;
    total: string | null;
  };
  /** When set, email field is hidden and this address is used at checkout. */
  accountEmail?: string | null;
  /** False when the cart contains only virtual/downloadable items (no shipping). */
  needsShippingAddress?: boolean;
};

export function CheckoutForm({
  flatRates,
  chosenShippingMethods,
  cartSummary,
  accountEmail,
  needsShippingAddress = true,
}: Props) {
  const [billing, setBilling] = useState(emptyAddr);
  const [shipping, setShipping] = useState(emptyAddr);
  const [shippingDifferent, setShippingDifferent] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(), []);
  const billingRegions = useMemo(() => getRegionOptions(billing.country), [billing.country]);
  const shippingRegions = useMemo(() => getRegionOptions(shipping.country), [shipping.country]);

  const initialRateId = useMemo(() => {
    const chosenList = chosenShippingMethods ?? [];
    const match = flatRates.find((r) => chosenList.includes(r.id))?.id;
    if (match) return match;
    if (flatRates.length === 1) return flatRates[0].id;
    return "";
  }, [flatRates, chosenShippingMethods]);

  const [shippingRateId, setShippingRateId] = useState(initialRateId);

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

  function validateAddressSide(
    label: string,
    addr: Record<string, string>
  ): string | null {
    if (!addr.country.trim()) return `Select a country (${label}).`;
    if (!addr.state.trim()) {
      const regs = getRegionOptions(addr.country);
      return regs.length > 0
        ? `Select a province or state (${label}).`
        : `Enter your state or province (${label}).`;
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailResolved = (accountEmail?.trim() || billing.email.trim()) || "";
    if (!emailResolved) {
      setError("Email is required.");
      return;
    }

    if (!billing.firstName.trim() || !billing.lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (needsShippingAddress) {
      const billErr = validateAddressSide("billing", { ...billing, email: emailResolved });
      if (billErr) {
        setError(billErr);
        return;
      }

      if (shippingDifferent) {
        const ship = { ...shipping };
        const shipErr = validateAddressSide("shipping", ship);
        if (shipErr) {
          setError(shipErr);
          return;
        }
      }

      if (flatRates.length > 1 && !shippingRateId) {
        setError("Choose a shipping method.");
        return;
      }
    }
    if (!acceptTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }

    setPending(true);
    try {
      const billingPayload = needsShippingAddress
        ? { ...billing, email: emailResolved }
        : {
            firstName: billing.firstName.trim(),
            lastName: billing.lastName.trim(),
            email: emailResolved,
            country: billing.country.trim() || "CA",
          };

      const body: Record<string, unknown> = {
        billing: billingPayload,
        shipToDifferentAddress: needsShippingAddress ? shippingDifferent : false,
        customerNote: customerNote.trim(),
        needsShippingAddress,
      };
      if (needsShippingAddress && shippingDifferent) {
        const ship = { ...shipping };
        delete ship.email;
        body.shipping = ship;
      }
      if (needsShippingAddress && flatRates.length > 0 && shippingRateId) {
        body.shippingMethods = [shippingRateId];
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirect?: string | null;
        order?: { databaseId?: number | null };
      };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Checkout failed.");
        return;
      }

      if (data.redirect && typeof data.redirect === "string" && data.redirect.length > 0) {
        window.location.href = data.redirect;
        return;
      }

      const id = data.order?.databaseId;
      if (typeof id === "number" && id > 0) {
        window.location.href = `/checkout/thank-you?order=${encodeURIComponent(String(id))}`;
        return;
      }

      window.location.href = "/checkout/thank-you";
    } catch {
      setError("Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10 font-sans">
      <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-5 font-sans text-sm text-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-body">Order summary</p>
        <dl className="mt-4 space-y-2">
          {cartSummary.subtotal ? (
            <div className="flex justify-between gap-4">
              <dt className="text-body">Subtotal</dt>
              <dd>{cartSummary.subtotal}</dd>
            </div>
          ) : null}
          {cartSummary.shipping ? (
            <div className="flex justify-between gap-4">
              <dt className="text-body">Shipping</dt>
              <dd>{cartSummary.shipping}</dd>
            </div>
          ) : null}
          {cartSummary.discount ? (
            <div className="flex justify-between gap-4">
              <dt className="text-body">Discount</dt>
              <dd>−{cartSummary.discount}</dd>
            </div>
          ) : null}
          {cartSummary.total ? (
            <div className="flex justify-between gap-4 border-t border-black/[0.06] pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{cartSummary.total}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {error ? (
        <p className="rounded-xl border border-dusty-rose/40 bg-white/70 px-4 py-3 text-sm text-heading" role="alert">
          {error}
        </p>
      ) : null}

      {needsShippingAddress && flatRates.length > 1 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white/50 px-4 py-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-body">
            Shipping method
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {flatRates.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[0.06] bg-cream/80 px-3 py-3 font-sans text-sm transition hover:border-dusty-rose/40 has-[:checked]:border-dusty-rose/50 has-[:checked]:bg-white">
                  <input
                    type="radio"
                    name="checkout-shipping-rate"
                    value={r.id}
                    checked={shippingRateId === r.id}
                    disabled={pending}
                    onChange={() => setShippingRateId(r.id)}
                    className="h-4 w-4 shrink-0 accent-dusty-rose"
                  />
                  <span className="min-w-0 flex-1 leading-snug text-heading">{r.label}</span>
                  <span className="shrink-0 tabular-nums text-body">
                    {formatShippingCostForDisplay(r.cost)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="font-heading text-lg text-heading">
          {needsShippingAddress ? "Billing address" : "Contact details"}
        </h3>
        {!needsShippingAddress ? (
          <p className="font-sans text-sm text-body">
            Digital order — no shipping address needed. We&apos;ll email your download link after
            payment.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" id="co-bill-fn" value={billing.firstName} onChange={(v) => setBill("firstName", v)} />
          <Field label="Last name" id="co-bill-ln" value={billing.lastName} onChange={(v) => setBill("lastName", v)} />
        </div>
        {needsShippingAddress ? (
          <>
        <Field label="Company (optional)" id="co-bill-co" value={billing.company} onChange={(v) => setBill("company", v)} />
        <Field label="Address line 1" id="co-bill-a1" value={billing.address1} onChange={(v) => setBill("address1", v)} />
        <Field label="Address line 2" id="co-bill-a2" value={billing.address2} onChange={(v) => setBill("address2", v)} />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="co-bill-country" className={acctLabelClass}>
            Country
          </label>
          <select
            id="co-bill-country"
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
          <Field
            label="City"
            id="co-bill-city"
            autoComplete="address-level2"
            value={billing.city}
            onChange={(v) => setBill("city", v)}
          />
          {billingRegions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="co-bill-state" className={acctLabelClass}>
                Province / State
              </label>
              <select
                id="co-bill-state"
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
              id="co-bill-state"
              autoComplete="address-level1"
              value={billing.state}
              onChange={(v) => setBill("state", v)}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Postal code"
            id="co-bill-zip"
            autoComplete="postal-code"
            value={billing.postcode}
            onChange={(v) => setBill("postcode", v)}
          />
          <Field label="Phone" id="co-bill-phone" type="tel" autoComplete="tel" value={billing.phone} onChange={(v) => setBill("phone", v)} />
        </div>
          </>
        ) : null}

        {accountEmail ? (
          <div className="rounded-xl border border-black/[0.08] bg-cream/80 px-4 py-3 font-sans text-sm text-heading">
            <span className="text-body">Email </span>
            <span className="font-medium">{accountEmail}</span>
          </div>
        ) : (
          <Field
            label="Email"
            id="co-bill-email"
            type="email"
            autoComplete="email"
            value={billing.email}
            onChange={(v) => setBill("email", v)}
          />
        )}
      </div>

      {needsShippingAddress ? (
      <div className="border-t border-black/[0.06] pt-8">
        <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-heading">
          <input
            type="checkbox"
            checked={shippingDifferent}
            onChange={(e) => setShippingDifferent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/[0.2] text-dusty-rose focus:ring-dusty-rose"
          />
          <span>Shipping address is different from billing</span>
        </label>
      </div>
      ) : null}

      {needsShippingAddress && shippingDifferent ? (
        <div className="space-y-4">
          <h3 className="font-heading text-lg text-heading">Shipping address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" id="co-ship-fn" value={shipping.firstName} onChange={(v) => setShip("firstName", v)} />
            <Field label="Last name" id="co-ship-ln" value={shipping.lastName} onChange={(v) => setShip("lastName", v)} />
          </div>
          <Field label="Company (optional)" id="co-ship-co" value={shipping.company} onChange={(v) => setShip("company", v)} />
          <Field label="Address line 1" id="co-ship-a1" value={shipping.address1} onChange={(v) => setShip("address1", v)} />
          <Field label="Address line 2" id="co-ship-a2" value={shipping.address2} onChange={(v) => setShip("address2", v)} />

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="co-ship-country" className={acctLabelClass}>
              Country
            </label>
            <select
              id="co-ship-country"
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
            <Field
              label="City"
              id="co-ship-city"
              autoComplete="address-level2"
              value={shipping.city}
              onChange={(v) => setShip("city", v)}
            />
            {shippingRegions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="co-ship-state" className={acctLabelClass}>
                  Province / State
                </label>
                <select
                  id="co-ship-state"
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
                id="co-ship-state"
                autoComplete="address-level1"
                value={shipping.state}
                onChange={(v) => setShip("state", v)}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Postal code"
              id="co-ship-zip"
              autoComplete="shipping postal-code"
              value={shipping.postcode}
              onChange={(v) => setShip("postcode", v)}
            />
            <Field label="Phone" id="co-ship-phone" type="tel" autoComplete="tel" value={shipping.phone} onChange={(v) => setShip("phone", v)} />
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="co-note" className={acctLabelClass}>
          Order notes (optional)
        </label>
        <textarea
          id="co-note"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={3}
          className={`${acctInputClass} mt-2 resize-y`}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-heading">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-black/[0.2] text-dusty-rose focus:ring-dusty-rose"
        />
        <span>I agree to the terms and conditions.</span>
      </label>

      <button type="submit" disabled={pending} className={`${acctBtnPrimaryClass} w-full sm:w-auto`}>
        {pending ? "Continuing…" : "Continue to PayPal"}
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
