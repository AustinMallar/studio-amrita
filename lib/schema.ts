import type { FaqItem } from "./faq-content";
import { htmlToPlainText } from "./html-text";
import { PRODUCT_NAMES } from "./product-names";
import { productQualifiesForGlowBearFreeShipping } from "./shipping";
import { SOCIAL_LINKS } from "./social-links";
import { absoluteUrl, SITE } from "./site";
import type { ProductDetailView } from "@/types/product-detail";

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

export type SchemaListItem = {
  name: string;
  url: string;
  position?: number;
  image?: string;
};

export type SchemaBreadcrumbItem = {
  name: string;
  path: string;
};

const COLLECTION_NAMES: Record<string, string> = {
  "essential-glow-bear": PRODUCT_NAMES.essentialGlowBear,
  "classic-glow-bear": PRODUCT_NAMES.classicGlowBear,
  "baby-glow-bear": PRODUCT_NAMES.babyGlowBear,
  accessories: "Accessories",
  "skincare-charms": "Skincare Charms",
  "crochet-patterns": "Crochet Patterns",
  "glow-bow-charms": "Glow Bow Charms",
};

function stripHtml(html: string): string {
  return htmlToPlainText(html, { collapseWhitespace: true });
}

/** Parse the first numeric amount from a formatted price label. */
export function parsePriceAmount(label: string): number | null {
  const match = label.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function formatPriceAmount(value: number): string {
  return value.toFixed(2);
}

function collectionNameFromSlug(slug: string): string {
  return COLLECTION_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl(SITE.logoPath),
    email: SITE.email,
    sameAs: [SOCIAL_LINKS.instagram.href, SOCIAL_LINKS.tiktok.href],
  };
}

export function webSiteSchema(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": ORG_ID },
  };
}

export function webPageSchema(input: {
  path: string;
  name: string;
  description?: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "FAQPage";
  primaryImage?: string;
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  const pageId = `${url}#webpage`;

  return {
    "@type": input.type ?? "WebPage",
    "@id": pageId,
    url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    ...(input.primaryImage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: input.primaryImage,
          },
        }
      : {}),
  };
}

export function breadcrumbListSchema(items: SchemaBreadcrumbItem[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListSchema(items: SchemaListItem[]): Record<string, unknown> {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function faqPageSchema(items: FaqItem[], path = "/faq"): Record<string, unknown> {
  return {
    ...webPageSchema({
      path,
      name: "FAQ | Studio Amrita",
      description: `Questions about our crochet ${PRODUCT_NAMES.glowBears}, skincare minis, shipping, and gift-ready packaging.`,
      type: "FAQPage",
    }),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function freeShippingDetails(): Record<string, unknown> {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency: SITE.currency,
    },
  };
}

function productOffers(product: ProductDetailView): Record<string, unknown> {
  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const shippingDetails = productQualifiesForGlowBearFreeShipping(product.categorySlugs)
    ? freeShippingDetails()
    : undefined;
  const variationPrices = product.variations
    .map((variation) => parsePriceAmount(variation.price))
    .filter((value): value is number => value != null);

  if (variationPrices.length > 1) {
    const low = Math.min(...variationPrices);
    const high = Math.max(...variationPrices);
    return {
      "@type": "AggregateOffer",
      url: productUrl,
      priceCurrency: SITE.currency,
      lowPrice: formatPriceAmount(low),
      highPrice: formatPriceAmount(high),
      offerCount: variationPrices.length,
      availability: "https://schema.org/InStock",
      ...(shippingDetails ? { shippingDetails } : {}),
    };
  }

  const price =
    variationPrices[0] ?? parsePriceAmount(product.priceLabel) ?? null;

  return {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: SITE.currency,
    ...(price != null ? { price: formatPriceAmount(price) } : {}),
    availability: "https://schema.org/InStock",
    ...(shippingDetails ? { shippingDetails } : {}),
  };
}

export function productSchema(product: ProductDetailView): Record<string, unknown> {
  const description = stripHtml(String(product.descriptionHtml ?? ""));
  const images = [
    product.imageUrl,
    ...product.galleryImages.map((image) => image.url),
    ...product.variations.map((variation) => variation.imageUrl),
  ].filter((url, index, list) => url && list.indexOf(url) === index);

  return {
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${product.slug}`)}#product`,
    name: product.name,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    sku: String(product.databaseId || product.slug),
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    offers: productOffers(product),
  };
}

export function productPageSchemas(product: ProductDetailView): Record<string, unknown>[] {
  const description = stripHtml(String(product.descriptionHtml ?? ""));
  const breadcrumbs: SchemaBreadcrumbItem[] = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];

  const primaryCategory = product.categorySlugs[0];
  if (primaryCategory) {
    breadcrumbs.push({
      name: collectionNameFromSlug(primaryCategory),
      path: `/shop/${primaryCategory}`,
    });
  }

  breadcrumbs.push({
    name: product.name,
    path: `/products/${product.slug}`,
  });

  return [
    webPageSchema({
      path: `/products/${product.slug}`,
      name: `${product.name} | Studio Amrita`,
      description: description || `${product.name} from Studio Amrita.`,
      primaryImage: product.imageUrl || undefined,
    }),
    productSchema(product),
    breadcrumbListSchema(breadcrumbs),
  ];
}

export function collectionPageSchemas(input: {
  path: string;
  name: string;
  description?: string;
  products: SchemaListItem[];
  pageType?: "WebPage" | "CollectionPage";
  primaryImage?: string;
}): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [
    webPageSchema({
      path: input.path,
      name: input.name,
      description: input.description,
      type: input.pageType ?? "CollectionPage",
      primaryImage: input.primaryImage,
    }),
    breadcrumbListSchema(breadcrumbsForCollection(input.path, input.name)),
  ];

  if (input.products.length > 0) {
    schemas.push(itemListSchema(input.products));
  }

  return schemas;
}

function breadcrumbsForCollection(path: string, name: string): SchemaBreadcrumbItem[] {
  if (path === "/") {
    return [{ name: "Home", path: "/" }];
  }

  const items: SchemaBreadcrumbItem[] = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];

  if (path !== "/shop") {
    items.push({ name, path });
  }

  return items;
}

export function siteWideSchemas(): Record<string, unknown>[] {
  return [organizationSchema(), webSiteSchema()];
}
