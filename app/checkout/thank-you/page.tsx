import { ThankYouCartSync } from "./ThankYouCartSync";
import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

function pickOrderId(sp: Record<string, string | string[] | undefined>): string | null {
  const raw = sp.order ?? sp.order_id ?? sp.orderId;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0].trim();
  }
  return null;
}

export default async function CheckoutThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderRef = pickOrderId(sp);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <ThankYouCartSync />
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-14 sm:px-6">
        <h1 className="font-heading text-3xl text-heading">Thank you</h1>
        <p className="font-sans text-body leading-relaxed">
          Your order has been received
          {orderRef ? (
            <>
              {" "}
              (order <span className="tabular-nums text-heading">#{orderRef}</span>)
            </>
          ) : null}
          . We’ll send a confirmation email shortly. If payment is still processing, you’ll receive
          another update when it completes.
        </p>
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
