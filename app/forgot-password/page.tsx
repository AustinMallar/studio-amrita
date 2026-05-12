import { FooterValues } from "@/components/FooterValues";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { PromoBar } from "@/components/PromoBar";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
          <h1 className="font-heading text-3xl text-heading">Forgot password</h1>
          <p className="mt-2 font-sans text-sm text-body">
            Enter the email or username for your account. If it exists, we will send a reset link.
          </p>
        </div>

        <ForgotPasswordForm />
      </main>
      <FooterValues />
    </div>
  );
}
