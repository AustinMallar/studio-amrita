import Link from "next/link";

import { DownloadsSection } from "@/components/account/DownloadsSection";
import type { DownloadableItemView } from "@/lib/downloadables";

type Props = {
  downloads: DownloadableItemView[];
  signedIn: boolean;
};

export function OrderDownloadsNotice({ downloads, signedIn }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-sans text-sm leading-relaxed text-body">
        {signedIn
          ? "Your order confirmation email includes download links. You can also access your files below or anytime from your account."
          : "Your order confirmation email includes download links for any digital products. Create an account or sign in with the same email to access downloads from your account page."}
      </p>

      {signedIn && downloads.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-heading">Your downloads</h2>
          <DownloadsSection items={downloads} />
        </div>
      ) : signedIn ? (
        <p className="rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3 font-sans text-sm text-body">
          Downloads may take a minute to appear after payment. Check your email, or visit{" "}
          <Link href="/account#downloads" className="font-medium text-dusty-rose hover:underline">
            Account → Downloads
          </Link>{" "}
          shortly.
        </p>
      ) : (
        <p className="rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3 font-sans text-sm text-body">
          <Link href="/login?next=/account%23downloads" className="font-medium text-dusty-rose hover:underline">
            Sign in
          </Link>{" "}
          with your checkout email to save downloads to your account.
        </p>
      )}

      {signedIn ? (
        <Link
          href="/account#downloads"
          className="inline-flex w-fit font-sans text-sm font-semibold text-dusty-rose hover:underline"
        >
          View all downloads in your account →
        </Link>
      ) : null}
    </div>
  );
}
