import { AccountSubNav } from "@/components/account/AccountSubNav";
import { BillingShippingForms } from "@/components/account/BillingShippingForms";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { OrdersSection } from "@/components/account/OrdersSection";
import { ProfileDetailsForm } from "@/components/account/ProfileDetailsForm";
import { FooterValues } from "@/components/FooterValues";
import { LogoutButton } from "@/components/LogoutButton";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchAccountOverview,
  type OrderSummary,
} from "@/lib/account-data";
import { tryDeleteJwtAuthCookieServer } from "@/lib/auth-cookie";
import { getJwtAuthToken } from "@/lib/auth-session";
import { uniqueGraphQLErrorMessages } from "@/lib/jwt-auth-errors";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const token = await getJwtAuthToken();
  if (!token) {
    redirect("/login?next=/account");
  }

  const overview = await fetchAccountOverview(token);

  if (overview.jwtInvalid) {
    await tryDeleteJwtAuthCookieServer();
    redirect("/login?next=/account");
  }

  const gqlErrors = uniqueGraphQLErrorMessages(overview.errors);
  const sessionErrMsg = gqlErrors.join(" ") || "Your session could not be verified.";
  /** Avoid repeating generic advice when WordPress already returned a JWT/auth message. */
  const showSessionHint =
    !/expired|invalid|jwt|token|unauthorized|not authenticated|signature|Forbidden/i.test(
      sessionErrMsg
    );
  const viewer = overview.data?.viewer ?? null;
  const customer = overview.data?.customer ?? null;

  const orders = (customer?.orders?.nodes ?? []).filter(Boolean) as OrderSummary[];

  const displayFirst =
    customer?.firstName?.trim() ||
    viewer?.firstName?.trim() ||
    customer?.displayName?.trim() ||
    viewer?.username?.trim() ||
    "Member";

  const displayLast =
    customer?.lastName?.trim() || viewer?.lastName?.trim() || "";

  const displayName =
    [displayFirst, displayLast].filter((s) => s && s !== "Member").join(" ").trim() || displayFirst;

  const email =
    customer?.email?.trim() || viewer?.email?.trim() || "";

  const username = customer?.username?.trim() || viewer?.username?.trim() || "";

  const invalidSession = !viewer;

  const wcMissing = Boolean(viewer && !customer);

  const orderCount = customer?.orderCount ?? orders.length;
  const totalSpent =
    typeof customer?.totalSpent === "number" && !Number.isNaN(customer.totalSpent)
      ? customer.totalSpent
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <div id="overview" className="scroll-mt-28">
          <h1 className="font-heading text-3xl text-heading">Your account</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-body">
            Manage your profile, addresses, password, and review orders from WooCommerce.
          </p>
        </div>

        {invalidSession ? (
          <div className="space-y-4 font-sans">
            <p className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3 text-sm text-heading">
              {sessionErrMsg}
              {showSessionHint ? <> Sign in again if your session expired.</> : null}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login?next=/account"
                className="inline-flex items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
              >
                Sign in
              </Link>
              <LogoutButton />
            </div>
          </div>
        ) : (
          <>
            <AccountSubNav />

            {wcMissing ? (
              <p className="rounded-2xl border border-black/[0.08] bg-white/50 px-4 py-3 font-sans text-sm text-heading">
                WooCommerce customer data was not returned. Confirm WPGraphQL for WooCommerce is
                active and your user is linked as a customer.
              </p>
            ) : null}

            <section
              className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 sm:px-7 sm:py-6"
              aria-labelledby="account-overview-heading"
            >
              <h2 id="account-overview-heading" className="font-heading text-xl text-heading">
                Overview
              </h2>
              <p className="mt-2 font-sans text-sm text-body">
                Signed in as{" "}
                <span className="font-semibold text-heading">{displayName}</span>
                {email ? (
                  <>
                    {" "}
                    · <span className="text-body">{email}</span>
                  </>
                ) : null}
                {username ? (
                  <span className="text-body">
                    {" "}
                    · @{username}
                  </span>
                ) : null}
              </p>
              <dl className="mt-6 grid gap-4 font-sans sm:grid-cols-2">
                <div className="rounded-xl border border-black/[0.06] bg-cream/80 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-body">Orders</dt>
                  <dd className="mt-1 text-2xl font-semibold text-heading">{orderCount}</dd>
                </div>
                <div className="rounded-xl border border-black/[0.06] bg-cream/80 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-body">
                    Lifetime total (store)
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-heading">
                    {totalSpent != null
                      ? totalSpent.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "N/A"}
                  </dd>
                </div>
              </dl>
              <div className="mt-6">
                <LogoutButton />
              </div>
            </section>

            <section id="orders" className="scroll-mt-28 space-y-4">
              <h2 className="font-heading text-xl text-heading">Recent orders</h2>
              <OrdersSection orders={orders} />
            </section>

            {!wcMissing ? (
              <>
                <section id="addresses" className="scroll-mt-28 space-y-4">
                  <div>
                    <h2 className="font-heading text-xl text-heading">Billing & shipping</h2>
                    <p className="mt-1 font-sans text-sm text-body">
                      Used for checkout and delivery. Choose your country, then province or state when
                      listed.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-6 sm:px-7">
                    <BillingShippingForms
                      initialBilling={customer?.billing}
                      initialShipping={customer?.shipping}
                      accountEmail={email || null}
                    />
                  </div>
                </section>

                <section id="profile" className="scroll-mt-28 space-y-4">
                  <h2 className="font-heading text-xl text-heading">Profile details</h2>
                  <div className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-6 sm:px-7">
                    <ProfileDetailsForm
                      initialFirstName={customer?.firstName ?? viewer?.firstName ?? ""}
                      initialLastName={customer?.lastName ?? viewer?.lastName ?? ""}
                      initialEmail={email}
                    />
                  </div>
                </section>

                <section id="password" className="scroll-mt-28 space-y-4">
                  <h2 className="font-heading text-xl text-heading">Change password</h2>
                  <div className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-6 sm:px-7">
                    <ChangePasswordForm />
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </main>
      <FooterValues />
    </div>
  );
}
