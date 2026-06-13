import type { DownloadableItemView } from "@/lib/downloadables";

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DownloadsSection({ items }: { items: DownloadableItemView[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-5 font-sans text-sm text-body sm:px-7">
        No downloadable files yet. Digital patterns and other downloads will appear here after you
        purchase them while signed in to your account.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const expiry = formatExpiry(item.accessExpires);
        return (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0 font-sans text-sm">
              <p className="font-semibold text-heading">{item.productName}</p>
              <p className="mt-1 text-body">{item.fileLabel}</p>
              {item.downloadsRemaining != null && item.downloadsRemaining !== "" ? (
                <p className="mt-1 text-xs text-body">
                  Downloads remaining: {item.downloadsRemaining}
                </p>
              ) : null}
              {expiry ? (
                <p className="mt-1 text-xs text-body">Access until {expiry}</p>
              ) : null}
            </div>
            <a
              href={item.downloadUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-dusty-rose px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-dusty-rose/90"
              download
            >
              Download PDF
            </a>
          </li>
        );
      })}
    </ul>
  );
}
