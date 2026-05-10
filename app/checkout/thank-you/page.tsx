import { ThankYouCartSync } from "./ThankYouCartSync";
import { OrderThankYouSummary } from "@/components/OrderThankYouSummary";
import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchThankYouOrderView } from "@/lib/order-thank-you";
import { getJwtAuthToken } from "@/lib/auth-session";
import { WOOCOMMERCE_SESSION_COOKIE } from "@/lib/session-cookie";
import Link from "next/link";
import { cookies } from "next/headers";

function pickFirstString(sp: Record<string, string | string[] | undefined>, keys: string[]): string | null {
  for (const k of keys) {
    const raw = sp[k];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
    if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim().length > 0) return raw[0].trim();
  }
  return null;
}

export default async function CheckoutThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderRaw = pickFirstString(sp, ["order", "order_id", "orderId"]);
  const orderId = orderRaw != null ? Number.parseInt(orderRaw, 10) : NaN;
  const orderKey = pickFirstString(sp, ["key", "order_key"]);
  const billingEmail = pickFirstString(sp, ["email", "billing_email"]);

  const cookieStore = await cookies();
  const session = cookieStore.get(WOOCOMMERCE_SESSION_COOKIE)?.value ?? null;
  const jwt = await getJwtAuthToken();

  let result: Awaited<ReturnType<typeof fetchThankYouOrderView>> | null = null;

  if (Number.isFinite(orderId) && orderId > 0) {
    try {
      result = await fetchThankYouOrderView({
        orderId,
        orderKey,
        billingEmail,
        sessionToken: session,
        jwt,
      });
    } catch {
      result = {
        ok: false,
        message: "Could not load order details. Check WORDPRESS_API_URL and try again.",
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <ThankYouCartSync />
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-14 sm:px-6">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <h1 className="font-heading text-3xl text-heading">Thank you</h1>

        {!Number.isFinite(orderId) || orderId <= 0 ? (
          <p className="font-sans text-body leading-relaxed">
            No order reference was found in the link. Use the confirmation link from your email or return to
            the shop.
          </p>
        ) : result?.ok ? (
          <>
            <p className="font-sans text-sm text-body leading-relaxed">
              Your payment was received. Here&apos;s a summary of your order.
            </p>
            <OrderThankYouSummary view={result.view} />
          </>
        ) : (
          <>
            <p className="rounded-2xl border border-dusty-rose/35 bg-white/60 px-4 py-3 font-sans text-sm text-heading">
              {result?.message ??
                "We couldn’t load order details. Your order may still be processing — check your email for confirmation."}
            </p>
            <p className="font-sans text-sm text-body">
              Order reference: <span className="tabular-nums font-medium text-heading">#{orderId}</span>
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-flex w-fit items-center justify-center rounded-full bg-dusty-rose px-8 py-3 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
        >
          Continue shopping
        </Link>
      </main>
      <FooterValues />
    </div>
  );
}
