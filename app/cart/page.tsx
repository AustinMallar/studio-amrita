import { CartLineThumb } from "@/components/CartLineThumb";
import { CartShippingSelector } from "@/components/CartShippingSelector";
import { RemoveFromCartButton } from "@/components/RemoveFromCartButton";
import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { imageFromCartProductNode } from "@/lib/cart-product-image";
import { flattenShippingRates, formatShippingCostForDisplay } from "@/lib/cart-shipping-utils";
import { WooSessionSync } from "@/components/WooSessionSync";
import { loadCartPageData } from "@/lib/cart-page-data";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import Link from "next/link";
import { cookies } from "next/headers";

export default async function CartPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value ?? null;
  const jwt = await getJwtAuthToken();

  const { cart, gqlErrors, sessionSyncNeeded } = await loadCartPageData(session, jwt);

  const lines = (cart?.contents?.nodes ?? []).filter(Boolean);
  const flatRates = flattenShippingRates(cart?.availableShippingMethods);
  const shippingLabel = cart?.shippingTotal?.trim() ?? "";
  const hasShippingAmount = shippingLabel.length > 0;
  const showShippingRow = hasShippingAmount || flatRates.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <WooSessionSync active={sessionSyncNeeded} />
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <h1 className="font-heading text-3xl text-heading">Your cart</h1>

        {gqlErrors.length > 0 ? (
          <p className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3 font-sans text-sm text-heading">
            {gqlErrors.join(" ")}
          </p>
        ) : null}

        {lines.length === 0 && gqlErrors.length === 0 ? (
          <p className="font-sans text-body">Your cart is empty.</p>
        ) : null}

        {lines.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const node = line?.product?.node;
              const name = node?.name ?? "Product";
              const qty = line?.quantity ?? 0;
              const sub = line?.subtotal ?? "";
              const { imageUrl, imageAlt } = imageFromCartProductNode(node);
              return (
                <li
                  key={line?.key ?? `line-${index}`}
                  className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3 font-sans text-sm"
                >
                  <CartLineThumb imageUrl={imageUrl} imageAlt={imageAlt} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <p className="font-semibold leading-snug text-heading">{name}</p>
                      <p className="mt-1 text-body">
                        × {qty}
                        {sub ? ` · ${sub}` : ""}
                      </p>
                    </div>
                    {line?.key ? <RemoveFromCartButton cartKey={line.key} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {lines.length > 0 && flatRates.length > 0 ? (
          <CartShippingSelector
            rates={flatRates}
            chosenShippingMethods={cart?.chosenShippingMethods}
          />
        ) : null}

        {Boolean(cart?.needsShippingAddress) && flatRates.length === 0 && lines.length > 0 ? (
          <p className="rounded-2xl border border-black/[0.06] bg-white/50 px-4 py-3 font-sans text-sm text-body">
            Enter your full shipping address at checkout to see every delivery option. Your store
            may show an estimate using the default region until then.
          </p>
        ) : null}

        {(cart?.subtotal || cart?.total || showShippingRow) && lines.length > 0 ? (
          <div className="space-y-4 border-t border-black/[0.08] pt-6 font-sans text-heading">
            {cart?.subtotal ? (
              <p className="flex justify-between text-body">
                <span>Subtotal</span>
                <span>{cart.subtotal}</span>
              </p>
            ) : null}
            {showShippingRow ? (
              <p className="flex justify-between text-body">
                <span>Shipping</span>
                <span className="text-right">
                  {hasShippingAmount
                    ? formatShippingCostForDisplay(shippingLabel)
                    : flatRates.length === 1
                      ? formatShippingCostForDisplay(flatRates[0].cost)
                      : "N/A"}
                </span>
              </p>
            ) : null}
            {cart?.total ? (
              <p className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{cart.total}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {lines.length > 0 ? (
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90 sm:w-auto"
          >
            Checkout with PayPal
          </Link>
        ) : null}
      </main>
      <FooterValues />
    </div>
  );
}
