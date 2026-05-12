import { FooterValues } from "@/components/FooterValues";
import { LoginForm } from "@/components/LoginForm";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/safe-next-path";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const sp = await searchParams;
  const nextHref = safeNextPath(sp.next);
  const showPasswordResetOk = sp.reset === "1";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/" className="text-dusty-rose hover:underline">
            ← Back to home
          </Link>
        </nav>

        <div>
          <h1 className="font-heading text-3xl text-heading">Sign in</h1>
          <p className="mt-2 font-sans text-sm text-body">
            Sign in with the same email or username you use for your Studio Amrita account.
          </p>
        </div>

        {showPasswordResetOk ? (
          <p className="rounded-2xl border border-black/[0.08] bg-white/60 px-4 py-3 font-sans text-sm text-heading">
            Your password was updated. Sign in with your new password.
          </p>
        ) : null}

        <LoginForm nextHref={nextHref} />
      </main>
      <FooterValues />
    </div>
  );
}
