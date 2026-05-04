import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { getCartQuery } from "@/lib/cart";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import Link from "next/link";
import { cookies } from "next/headers";

export default async function CartPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value ?? null;

  let gqlErrors: string[] = [];
  let cart: {
    contents?: {
      nodes?: Array<{
        key?: string;
        quantity?: number | null;
        subtotal?: string | null;
        product?: { node?: { name?: string | null } | null } | null;
      } | null> | null;
    } | null;
    total?: string | null;
    subtotal?: string | null;
  } | null = null;

  try {
    const result = await getCartQuery(session);
    if (result.errors?.length) {
      gqlErrors = result.errors
        .map((e) => (typeof e === "object" && e && "message" in e ? String((e as { message?: string }).message) : ""))
        .filter(Boolean);
    }
    cart = result.data?.cart ?? null;
  } catch {
    gqlErrors = ["Could not load cart. Check WORDPRESS_API_URL and WooCommerce session."];
  }

  const lines = (cart?.contents?.nodes ?? []).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <h1 className="font-display text-3xl text-heading">Your cart</h1>

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
              const name = line?.product?.node?.name ?? "Product";
              const qty = line?.quantity ?? 0;
              const sub = line?.subtotal ?? "";
              return (
                <li
                  key={line?.key ?? `line-${index}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3 font-sans text-sm"
                >
                  <span className="font-semibold text-heading">{name}</span>
                  <span className="text-body">
                    × {qty}
                    {sub ? ` · ${sub}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {(cart?.subtotal || cart?.total) && lines.length > 0 ? (
          <div className="border-t border-black/[0.08] pt-6 font-sans text-heading">
            {cart?.subtotal ? (
              <p className="flex justify-between text-body">
                <span>Subtotal</span>
                <span>{cart.subtotal}</span>
              </p>
            ) : null}
            {cart?.total ? (
              <p className="mt-2 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{cart.total}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="font-sans text-xs text-body">
          Checkout is handled on WordPress / WooCommerce — connect your payment flow when ready.
        </p>
      </main>
      <FooterValues />
    </div>
  );
}
