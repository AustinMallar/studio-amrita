import type { ProductGalleryImage } from "@/types/product-detail";
import { ProductDetailImage } from "@/components/ProductDetailImage";
import { ScrollReveal } from "@/components/ScrollReveal";

type Props = {
  mainImageUrl?: string;
  mainImageAlt?: string;
  galleryImages: ProductGalleryImage[];
};

export function ProductDetailGallery({
  mainImageUrl,
  mainImageAlt = "",
  galleryImages,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {mainImageUrl ? (
        <ScrollReveal
          className="w-full"
          rootMargin="0px 0px 12% 0px"
        >
          <ProductDetailImage url={mainImageUrl} alt={mainImageAlt} priority />
        </ScrollReveal>
      ) : null}
      {galleryImages.map((img, i) => (
        <ScrollReveal
          key={img.url}
          className="w-full"
          delayMs={40 + i * 56}
          rootMargin="0px 0px 12% 0px"
        >
          <ProductDetailImage url={img.url} alt={img.alt} />
        </ScrollReveal>
      ))}
    </div>
  );
}
