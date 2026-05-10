import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { RegisterForm } from "@/components/RegisterForm";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/safe-next-path";
import Link from "next/link";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextHref = safeNextPath(sp.next);

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
          <h1 className="font-heading text-3xl text-heading">Create account</h1>
          <p className="mt-2 font-sans text-sm text-body">
            Create a password-protected account to manage orders and preferences as we connect more
            features.
          </p>
        </div>

        <RegisterForm nextHref={nextHref} />
      </main>
      <FooterValues />
    </div>
  );
}
