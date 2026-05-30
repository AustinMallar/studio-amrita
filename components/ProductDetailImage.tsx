import Image from "next/image";

type Props = {
  url: string;
  alt: string;
  priority?: boolean;
};

function isRemoteUrl(url: string) {
  return Boolean(url && url.startsWith("http"));
}

export function ProductDetailImage({ url, alt, priority = false }: Props) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-blush">
      {isRemoteUrl(url) ? (
        // eslint-disable-next-line @next/next/no-img-element -- WP URLs vary per deploy
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={priority}
        />
      )}
    </div>
  );
}
