type Props = {
  /** Path served from `public/`, e.g. `/product-hover/matcha-green.mp4` */
  src: string;
};

/**
 * Optional clip for PDP — pairs with `HOVER_VIDEO_BY_SLUG` / files under `public/product-hover/`.
 */
export function ProductDetailVideo({ src }: Props) {
  return (
    <figure className="space-y-3">
      <figcaption className="font-sans text-sm font-semibold uppercase tracking-wide text-body">
        Paired with an outfit
      </figcaption>
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="mx-auto max-h-[min(70vh,520px)] w-full rounded-2xl bg-black/5 object-contain shadow-[0_4px_24px_rgba(92,77,77,0.08)]"
        preload="auto"
        aria-label="Product clip"
      >
        Your browser does not support the video tag.
      </video>
    </figure>
  );
}
