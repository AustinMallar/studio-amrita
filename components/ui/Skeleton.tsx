import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: Props) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-black/[0.07] ${className}`.trim()}
      aria-hidden
      {...props}
    />
  );
}
