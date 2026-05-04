import Image from "next/image";
import Link from "next/link";
import { optionToSwatchColor } from "@/lib/product-swatches";

export type UiProduct = {
  id: string;
  /** WooCommerce URL slug — when set, the whole card links to `/products/[slug]`. */
  slug?: string;
  name: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  swatches: string[];
};

export function ProductCard({ product }: { product: UiProduct }) {
  const hasRemote = Boolean(product.imageUrl && product.imageUrl.startsWith("http"));
  const href = product.slug ? `/products/${product.slug}` : null;

  const inner = (
    <article className="flex flex-col gap-3 rounded-2xl bg-white/60 p-3 shadow-[0_2px_8px_rgba(92,77,77,0.07),0_1px_2px_rgba(92,77,77,0.04)] transition hover:shadow-[0_4px_14px_rgba(92,77,77,0.1)]">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-blush/80">
        {product.imageUrl ? (
          hasRemote ? (
            // eslint-disable-next-line @next/next/no-img-element -- WP URLs vary per deploy
            <img
              src={product.imageUrl}
              alt={product.imageAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
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
      <div className="space-y-1 px-0.5 pt-0.5 text-center">
        <h3 className="font-sans text-base font-semibold text-heading">{product.name}</h3>
        <p className="font-sans text-sm text-body">{product.price}</p>
        {product.swatches.length > 0 ? (
          <div className="flex justify-center gap-2 pt-1">
            {product.swatches.slice(0, 4).map((opt, i) => (
              <span
                key={`${product.id}-sw-${i}`}
                title={opt}
                className="h-4 w-4 rounded-full border border-black/10 ring-2 ring-white"
                style={{ backgroundColor: optionToSwatchColor(opt, product.name) }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusty-rose">
        {inner}
      </Link>
    );
  }

  return inner;
}
