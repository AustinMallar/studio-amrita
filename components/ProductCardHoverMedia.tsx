"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  imageUrl: string;
  imageAlt: string;
  hoverMediaUrl: string;
  hoverMediaAlt: string;
  hoverMediaKind: "video" | "gif" | "image";
};

/**
 * First gallery GIF/video/still from WooCommerce; hover uses local state so it works without Tailwind group variants.
 */
export function ProductCardHoverMedia({
  imageUrl,
  imageAlt,
  hoverMediaUrl,
  hoverMediaAlt,
  hoverMediaKind,
}: Props) {
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || hoverMediaKind !== "video") return;
    if (hovering) {
      void v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovering, hoverMediaKind]);

  const baseLayer = `pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out ${
    hovering ? "opacity-0" : "opacity-100"
  }`;
  const hoverLayer = `pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300 ease-out ${
    hovering ? "opacity-100" : "opacity-0"
  }`;

  const hasRemoteBase = Boolean(imageUrl && imageUrl.startsWith("http"));

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl bg-blush/80"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div className={`${baseLayer} relative`}>
        {imageUrl ? (
          hasRemoteBase ? (
            // eslint-disable-next-line @next/next/no-img-element -- WP URLs vary per deploy
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center font-sans text-sm text-body">
            Image coming soon
          </div>
        )}
      </div>

      <div className={`${hoverLayer}`} aria-hidden>
        {hoverMediaKind === "video" ? (
          <video
            ref={videoRef}
            src={hoverMediaUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- GIF or second still from WooCommerce
          <img
            src={hoverMediaUrl}
            alt={hoverMediaKind === "gif" ? "" : hoverMediaAlt || ""}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
