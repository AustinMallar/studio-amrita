import type { ProductGalleryImage } from "@/types/product-detail";
import { ProductDetailImage } from "@/components/ProductDetailImage";
import { ScrollReveal } from "@/components/ScrollReveal";

type Props = {
  mainImageUrl?: string;
  mainImageAlt?: string;
  galleryImages: ProductGalleryImage[];
  /** lg+ shows the main image in a separate hero; this component lists gallery extras only. */
  mainShownSeparatelyOnDesktop?: boolean;
};

function buildSlides(
  mainImageUrl: string | undefined,
  mainImageAlt: string,
  galleryImages: ProductGalleryImage[]
): ProductGalleryImage[] {
  const slides: ProductGalleryImage[] = [];
  if (mainImageUrl) {
    slides.push({ url: mainImageUrl, alt: mainImageAlt });
  }
  for (const img of galleryImages) {
    if (!slides.some((slide) => slide.url === img.url)) {
      slides.push(img);
    }
  }
  return slides;
}

function MobileImageCarousel({ slides }: { slides: ProductGalleryImage[] }) {
  if (slides.length === 0) return null;

  return (
    <div
      className="lg:hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Product images"
    >
      <div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((img, i) => (
          <div
            key={img.url}
            className="w-full shrink-0 snap-center px-4"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            <ProductDetailImage url={img.url} alt={img.alt} priority={i === 0} />
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <p className="mt-3 text-center font-sans text-xs text-body">
          Swipe for more photos
        </p>
      ) : null}
    </div>
  );
}

function DesktopImageStack({
  slides,
  startIndex = 0,
}: {
  slides: ProductGalleryImage[];
  startIndex?: number;
}) {
  if (slides.length === 0) return null;

  return (
    <div className="hidden flex-col gap-4 lg:flex">
      {slides.map((img, i) => (
        <ScrollReveal
          key={img.url}
          className="w-full"
          delayMs={40 + (startIndex + i) * 56}
          rootMargin="0px 0px 12% 0px"
        >
          <ProductDetailImage url={img.url} alt={img.alt} priority={startIndex + i === 0} />
        </ScrollReveal>
      ))}
    </div>
  );
}

export function ProductDetailGallery({
  mainImageUrl,
  mainImageAlt = "",
  galleryImages,
  mainShownSeparatelyOnDesktop = false,
}: Props) {
  const mobileSlides = buildSlides(mainImageUrl, mainImageAlt, galleryImages);
  const desktopSlides = mainShownSeparatelyOnDesktop
    ? galleryImages.filter((img) => img.url !== mainImageUrl)
    : mobileSlides;

  if (mobileSlides.length === 0 && desktopSlides.length === 0) {
    return null;
  }

  return (
    <>
      <MobileImageCarousel slides={mobileSlides} />
      <DesktopImageStack slides={desktopSlides} />
    </>
  );
}
