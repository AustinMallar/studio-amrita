type Props = {
  src: string;
  ariaLabel: string;
};

export function StorySectionVideo({ src, ariaLabel }: Props) {
  return (
    <div className="relative aspect-[4/5] max-h-[520px] w-full overflow-hidden rounded-3xl bg-cream/40">
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
        aria-label={ariaLabel}
      />
    </div>
  );
}

export const HOMEPAGE_STORY_VIDEO =
  "https://wordpress-1614797-6392323.cloudwaysapps.com/wp-content/uploads/2026/05/26391.mp4";

export const ABOUT_STORY_VIDEO =
  "https://wordpress-1614797-6392323.cloudwaysapps.com/wp-content/uploads/2026/05/26390.mp4";
