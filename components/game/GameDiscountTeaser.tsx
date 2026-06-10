type Props = {
  className?: string;
};

export function GameDiscountTeaser({ className = "" }: Props) {
  return (
    <p
      className={`rounded-2xl border border-dusty-rose/25 bg-dusty-rose/10 px-4 py-3 font-sans text-sm leading-relaxed text-heading ${className}`}
    >
      Beat the game to win an exclusive discount on your next order ♡
    </p>
  );
}
