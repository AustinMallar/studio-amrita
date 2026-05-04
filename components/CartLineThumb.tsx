import Image from "next/image";

type CartLineThumbProps = {
  imageUrl?: string;
  imageAlt?: string;
  /** Mini cart vs full cart row */
  size?: "sm" | "md";
};

export function CartLineThumb({ imageUrl, imageAlt, size = "sm" }: CartLineThumbProps) {
  const dim =
    size === "sm"
      ? "h-12 w-12 min-h-12 min-w-12 rounded-lg"
      : "h-16 w-16 min-h-16 min-w-16 rounded-xl sm:h-[5.25rem] sm:w-[5.25rem] sm:min-h-[5.25rem] sm:min-w-[5.25rem]";
  const sizes = size === "sm" ? "48px" : "84px";

  if (!imageUrl) {
    return (
      <div
        className={`shrink-0 ${dim} border border-black/[0.06] bg-blush/50`}
        aria-hidden
      />
    );
  }

  const remote = imageUrl.startsWith("http");

  return (
    <div className={`relative shrink-0 overflow-hidden ${dim} border border-black/[0.06] bg-blush/30`}>
      {remote ? (
        // eslint-disable-next-line @next/next/no-img-element -- cart URLs may be any Woo origin
        <img src={imageUrl} alt={imageAlt ?? ""} className="h-full w-full object-cover" />
      ) : (
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          fill
          className="object-cover"
          sizes={sizes}
        />
      )}
    </div>
  );
}
