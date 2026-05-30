import { SOCIAL_LINKS, type SocialPlatform } from "@/lib/social-links";

const PLATFORMS: SocialPlatform[] = ["instagram", "tiktok"];

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.9a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.83a8.19 8.19 0 0 0 4.76 1.52V6.9a4.85 4.85 0 0 1-1-.21z" />
    </svg>
  );
}

const ICONS: Record<SocialPlatform, typeof IconInstagram> = {
  instagram: IconInstagram,
  tiktok: IconTikTok,
};

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
  /** Icon button size in Tailwind scale (default h-5 w-5). */
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
};

const SIZE_CLASSES = {
  sm: { button: "h-9 w-9", icon: "h-4 w-4", gap: "gap-2" },
  md: { button: "h-11 w-11", icon: "h-5 w-5", gap: "gap-3" },
  lg: { button: "h-12 w-12", icon: "h-6 w-6", gap: "gap-4" },
} as const;

export function SocialLinks({
  className = "",
  iconClassName = "",
  size = "md",
  showLabels = false,
}: SocialLinksProps) {
  const sizes = SIZE_CLASSES[size];

  return (
    <ul
      className={`flex flex-wrap items-center ${sizes.gap} ${className}`}
      aria-label="Social media"
    >
      {PLATFORMS.map((platform) => {
        const { href, label } = SOCIAL_LINKS[platform];
        const Icon = ICONS[platform];

        return (
          <li key={platform}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-full border border-black/[0.08] bg-white/60 text-heading transition hover:border-dusty-rose/50 hover:bg-blush/60 hover:text-dusty-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusty-rose ${
                showLabels ? "gap-2 px-4 py-2.5 font-sans text-sm font-medium" : sizes.button
              }`}
              aria-label={`${label} (opens in new tab)`}
            >
              <Icon className={`${sizes.icon} shrink-0 ${iconClassName}`} />
              {showLabels ? label : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
