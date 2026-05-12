import { FooterValues } from "@/components/FooterValues";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; login?: string }>;
}) {
  const sp = await searchParams;
  const keyValue = typeof sp.key === "string" ? sp.key.trim() : "";
  const loginRaw = typeof sp.login === "string" ? sp.login.trim() : "";
  let loginValue = loginRaw;
  if (loginRaw) {
    try {
      loginValue = decodeURIComponent(loginRaw.replace(/\+/g, " "));
    } catch {
      loginValue = loginRaw;
    }
  }

  const validLink = Boolean(keyValue && loginValue);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
        <nav className="font-sans text-sm text-body">
          <Link href="/login" className="text-dusty-rose hover:underline">
            ← Back to sign in
          </Link>
        </nav>

        <div>
          <h1 className="font-heading text-3xl text-heading">Set a new password</h1>
          <p className="mt-2 font-sans text-sm text-body">
            Choose a new password for your account. After saving, sign in on the next page.
          </p>
        </div>

        {validLink ? (
          <ResetPasswordForm keyValue={keyValue} loginValue={loginValue} />
        ) : (
          <div className="space-y-4 font-sans text-sm text-heading">
            <p
              className="rounded-2xl border border-dusty-rose/40 bg-white/60 px-4 py-3"
              role="alert"
            >
              This reset link is missing required information or has expired. Request a new link
              below.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex font-medium text-dusty-rose hover:underline"
            >
              Forgot password
            </Link>
          </div>
        )}
      </main>
      <FooterValues />
    </div>
  );
}
