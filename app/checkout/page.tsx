import { CheckoutForm } from "@/components/CheckoutForm";
import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { wpFetchViewer } from "@/lib/auth-wp";
import { WooSessionSync } from "@/components/WooSessionSync";
import { loadCartPageData } from "@/lib/cart-page-data";
import { flattenShippingRates } from "@/lib/cart-shipping-utils";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value ?? null;
  const jwt = await getJwtAuthToken();

  const { cart, gqlErrors, sessionSyncNeeded } = await loadCartPageData(session, jwt);

  const lines = (cart?.contents?.nodes ?? []).filter(Boolean);
  if (lines.length === 0 && gqlErrors.length === 0) {
    redirect("/cart");
  }

  const flatRates = flattenShippingRates(cart?.availableShippingMethods);

  let accountEmail: string | null = null;
  if (jwt) {
    try {
      const vr = await wpFetchViewer(jwt);
      accountEmail = vr.data?.viewer?.email?.trim() ?? null;
    } catch {
      accountEmail = null;
    }
  }

  const shippingLabel = cart?.shippingTotal?.trim() ?? "";
  const cartSummary = {
    subtotal: cart?.subtotal ?? null,
    shipping: shippingLabel.length > 0 ? shippingLabel : null,
    total: cart?.total ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <WooSessionSync active={sessionSyncNeeded} />
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/cart" className="text-dusty-rose hover:underline">
            ← Back to cart
          </Link>
        </nav>

        <h1 className="font-heading text-3xl text-heading">Checkout</h1>

        {gqlErrors.length > 0 ? (
          <p className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3 font-sans text-sm text-heading">
            {gqlErrors.join(" ")}
          </p>
        ) : null}

        {lines.length > 0 ? (
          <>
            <p className="font-sans text-sm text-body">
              Pay with PayPal on the next step. You’ll leave this site briefly to approve payment,
              then return when it’s complete.
            </p>
            <CheckoutForm
              flatRates={flatRates}
              chosenShippingMethods={cart?.chosenShippingMethods}
              cartSummary={cartSummary}
              accountEmail={accountEmail}
            />
          </>
        ) : null}
      </main>
      <FooterValues />
    </div>
  );
}
