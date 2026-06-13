/**
 * Headless WordPress / WPGraphQL + WooCommerce API client.
 * POSTs GraphQL to process.env.WORDPRESS_API_URL
 */

import { getFrontendCategoryImage } from "./category-images";
import { htmlToPlainText } from "./html-text";
import { glowBearCardName, sortEssentialGlowBearProducts } from "./product-display";
import { getFrontendHoverVideo } from "./product-hover-videos";
import { swatchLabelsForProduct } from "./product-swatches";

const CATEGORY_SLUGS = {
  "Essential Glow Bear": "essential-glow-bear",
  /** Legacy slug — products now live under `accessories`. */
  "Glow Bow Charms": "glow-bow-charms",
};

/** Display order for `/shop`, homepage rows, and nav mega menu. */
const SHOP_CATEGORY_ORDER = [
  "essential-glow-bear",
  "classic-glow-bear",
  "baby-glow-bear",
  "accessories",
  "skincare-charms",
  "crochet-patterns",
];

/** WooCommerce categories omitted from the storefront (empty, legacy, or internal). */
const HIDDEN_SHOP_CATEGORY_SLUGS = new Set([
  "uncategorized",
  "glow-bears",
  "glow-bow-charms",
]);

const CATEGORY_FALLBACK_DESCRIPTIONS = {
  "essential-glow-bear":
    "Four handmade crochet bag charms, each paired with Klavuu lip balm and L'Occitane hand cream in gift-ready packaging.",
  "classic-glow-bear":
    "Our signature crochet bear keychain — soft, sweet, and ready to delight in every colour.",
  "baby-glow-bear":
    "A petite handmade baby glow bear keychain — a sweet self-care accessory or thoughtful gift.",
  accessories:
    "Handmade crochet bag charms and pouches — bows, berries, and more to clip, gift, or collect.",
  "skincare-charms":
    "Skincare minis on keychain hardware — lip balm, hand cream, and SPF you can glow with on the go.",
  "crochet-patterns":
    "Digital crochet patterns to make your own Studio Amrita pieces at home.",
};

function isShopCollectionSlugVisible(slug) {
  return !HIDDEN_SHOP_CATEGORY_SLUGS.has(slug);
}

function visibleShopCollectionSlugs() {
  return SHOP_CATEGORY_ORDER.filter(isShopCollectionSlugVisible);
}

/** All published storefront products are visible — WooCommerce controls catalog status. */
function isProductVisible() {
  return true;
}

function shopLabelForCategory(name) {
  const label = String(name ?? "").trim() || "Collection";
  return `SHOP ${label.toUpperCase()} ♡`;
}

function sortShopCategoryBlocks(blocks) {
  return [...blocks].sort((a, b) => {
    const ai = SHOP_CATEGORY_ORDER.indexOf(a.slug);
    const bi = SHOP_CATEGORY_ORDER.indexOf(b.slug);
    const aIdx = ai >= 0 ? ai : 999;
    const bIdx = bi >= 0 ? bi : 999;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return String(a.name).localeCompare(String(b.name));
  });
}

/** WooCommerce slug for the single variable “Classic Glow Bear” product (override via env). */
function classicGlowBearSlug() {
  return (
    process.env.CLASSIC_GLOW_BEAR_SLUG?.trim() || "classic-glow-bear"
  );
}

/**
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchAPI(query, variables = {}) {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) {
    console.warn(
      "[lib/api] WORDPRESS_API_URL is not set; GraphQL requests are skipped."
    );
    return { data: null, errors: [{ message: "Missing WORDPRESS_API_URL" }] };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  const json = await res.json();
  if (!res.ok) {
    return {
      data: null,
      errors: [{ message: `HTTP ${res.status}`, ...json }],
    };
  }
  return json;
}

/** GraphQL product fields shared by category listing queries. */
function homeProductFieldsFragment() {
  return `
  fragment HomeProductFields on Product {
    slug
    databaseId
    name
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    galleryImages(first: 24) {
      nodes {
        ... on MediaItem {
          sourceUrl
          mediaItemUrl
          altText
          mimeType
        }
      }
    }
    ... on SimpleProduct {
      formattedPrice: price
      rawPrice: price(format: RAW)
    }
    ... on VariableProduct {
      formattedPrice: price
      rawPrice: price(format: RAW)
    }
    ... on ProductWithAttributes {
      attributes {
        nodes {
          name
          label
          options
        }
      }
    }
  }
`;
}

/** All storefront categories with products (replaces hardcoded homepage query). */
export function buildAllShopCategoriesQuery() {
  return `
  ${homeProductFieldsFragment()}
  query AllShopCategories {
    productCategories(first: 40) {
      nodes {
        databaseId
        name
        description
        slug
        count
        image {
          sourceUrl
          altText
        }
        products(first: 24) {
          nodes {
            ...HomeProductFields
          }
        }
      }
    }
  }
`;
}

/** @deprecated Legacy query — prefer buildAllShopCategoriesQuery(). */
export function buildHomepageCollectionsQuery() {
  const classicSlug = classicGlowBearSlug();
  return `
  ${homeProductFieldsFragment()}

  query HomepageCollections {
    glowBearBundle: productCategory(id: "${CATEGORY_SLUGS["Essential Glow Bear"]}", idType: SLUG) {
      databaseId
      name
      description
      slug
      image {
        sourceUrl
        altText
      }
      products(first: 12) {
        nodes {
          ...HomeProductFields
        }
      }
    }
    classicGlowBearProduct: product(id: "${classicSlug}", idType: SLUG) {
      databaseId
      slug
      name
      description
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      ... on SimpleProduct {
        formattedPrice: price
        rawPrice: price(format: RAW)
      }
      ... on VariableProduct {
        formattedPrice: price
        rawPrice: price(format: RAW)
      }
      ... on ProductWithAttributes {
        attributes {
          nodes {
            name
            label
            options
          }
        }
      }
    }
    glowBowCharms: productCategory(id: "${CATEGORY_SLUGS["Glow Bow Charms"]}", idType: SLUG) {
      databaseId
      name
      description
      slug
      image {
        sourceUrl
        altText
      }
      products(first: 12) {
        nodes {
          ...HomeProductFields
        }
      }
    }
  }
`;
}

/**
 * Optional legacy/alternate query if categories use display names instead of slugs.
 */
export const HOMEPAGE_COLLECTIONS_BY_NAME_QUERY = `
  query HomepageCollectionsByName {
    categories: productCategories(where: { search: "Glow" }, first: 20) {
      nodes {
        databaseId
        name
        description
        slug
        image {
          sourceUrl
          altText
        }
        products(first: 12) {
          nodes {
            __typename
            slug
            databaseId
            name
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            galleryImages(first: 24) {
              nodes {
                ... on MediaItem {
                  sourceUrl
                  mediaItemUrl
                  altText
                  mimeType
                }
              }
            }
            ... on SimpleProduct {
              formattedPrice: price
              rawPrice: price(format: RAW)
            }
            ... on VariableProduct {
              formattedPrice: price
              rawPrice: price(format: RAW)
            }
            ... on ProductWithAttributes {
              attributes {
                nodes {
                  name
                  label
                  options
                }
              }
            }
          }
        }
      }
    }
  }
`;

function storeCurrency() {
  return process.env.NEXT_PUBLIC_STORE_CURRENCY?.trim() || "CAD";
}

function parseRawPriceMin(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  const nums = s
    .split(",")
    .map((part) => Number.parseFloat(part.trim()))
    .filter((n) => !Number.isNaN(n));
  if (nums.length > 0) return Math.min(...nums);
  const single = Number.parseFloat(s);
  return Number.isNaN(single) ? null : single;
}

function formatMoney(raw) {
  const n = parseRawPriceMin(raw);
  if (n == null) return raw != null && raw !== "" ? String(raw) : null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: storeCurrency(),
  }).format(n);
}

function pickPrice(node) {
  const raw =
    node?.rawPrice ??
    node?.price ??
    node?.regularPrice ??
    node?.salePrice;
  const formatted =
    node?.formattedPrice ??
    (node?.price && typeof node.price !== "object" ? String(node.price) : null);
  const minRaw = parseRawPriceMin(raw);
  const display =
    formatted ?? (minRaw != null ? formatMoney(minRaw) : null) ?? "N/A";
  return {
    price: display,
    rawPrice: minRaw != null ? String(minRaw) : raw,
  };
}

function mapVariationAttributeDefinitions(node) {
  const attrs = node?.attributes?.nodes ?? [];
  return attrs
    .map((a) => ({
      name: String(a.name ?? ""),
      label: String(a.label || a.name || "Option").trim(),
      options: Array.isArray(a.options)
        ? a.options.filter(Boolean).map(String)
        : [],
    }))
    .filter((a) => a.name && a.options.length > 0);
}

function primaryVariationAttribute(attrs) {
  const list = Array.isArray(attrs) ? attrs : [];
  return (
    list.find((a) => {
      const blob = `${a?.name || ""} ${a?.label || ""}`.toLowerCase();
      return /color|colour|shade|choose-your-glow|choose your glow/.test(blob);
    }) ?? list[0]
  );
}

function colorOptionsFromAttributes(node) {
  const attrs = node?.attributes?.nodes ?? node?.attributes ?? [];
  const list = Array.isArray(attrs) ? attrs : [];
  const colorAttr = primaryVariationAttribute(list);
  const opts = colorAttr?.options;
  if (Array.isArray(opts)) return opts.filter(Boolean).slice(0, 8);
  return [];
}

/**
 * WooCommerce product gallery (WPGraphQL WooCommerce): hover media from gallery items.
 * Upload GIF/video to Media Library and add it to the product gallery in admin.
 * Prefers video / GIF over the first gallery still; skips assets that match the featured image (normalized).
 * @param {string} url
 */
function hoverMediaKindFromUrl(url) {
  const path = String(url).split("?")[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov)$/i.test(path)) return "video";
  if (path.endsWith(".gif")) return "gif";
  return "image";
}

/**
 * Strip WP thumbnail suffixes and query string so featured vs gallery can be compared.
 * @param {string} url
 */
function normalizeUrlForDedupe(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    let path = u.pathname;
    path = path.replace(/-\d+x\d+(?=\.[a-z0-9]+)/i, "");
    path = path.replace(/-scaled(?=\.[a-z0-9]+)/i, "");
    return `${u.origin}${path}`.toLowerCase();
  } catch {
    let p = String(url).split("?")[0].toLowerCase();
    p = p.replace(/-\d+x\d+(?=\.[a-z0-9]+)/i, "");
    p = p.replace(/-scaled(?=\.[a-z0-9]+)/i, "");
    return p;
  }
}

/**
 * @param {Record<string, unknown>} n — galleryImages.nodes item
 * @param {string} url
 */
function kindFromGalleryNode(n, url) {
  const mime = String(n?.mimeType || "").toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime === "image/gif") return "gif";
  return hoverMediaKindFromUrl(url);
}

/**
 * @param {Record<string, unknown>} n
 */
function galleryNodeUrl(n) {
  const u = n?.sourceUrl || n?.mediaItemUrl;
  return u ? String(u) : "";
}

/**
 * @param {Record<string, unknown>} node — Product from GraphQL
 * @param {string} featuredUrl
 */
function pickGalleryHover(node, featuredUrl) {
  const rawNodes = node?.galleryImages?.nodes ?? [];
  const nodes = rawNodes.filter((n) => galleryNodeUrl(n));
  if (!nodes.length) return null;

  const feat = normalizeUrlForDedupe(featuredUrl);

  const enriched = nodes.map((n) => {
    const url = galleryNodeUrl(n);
    return {
      n,
      url,
      norm: normalizeUrlForDedupe(url),
      kind: kindFromGalleryNode(n, url),
    };
  });

  const notSameAsFeatured = (x) => !feat || x.norm !== feat;

  const video = enriched.find((x) => x.kind === "video" && notSameAsFeatured(x));
  if (video) {
    return {
      url: video.url,
      alt: String(video.n.altText ?? node.name ?? ""),
      kind: /** @type {"video"} */ ("video"),
    };
  }

  const gif = enriched.find((x) => x.kind === "gif" && notSameAsFeatured(x));
  if (gif) {
    return {
      url: gif.url,
      alt: String(gif.n.altText ?? node.name ?? ""),
      kind: /** @type {"gif"} */ ("gif"),
    };
  }

  const other = enriched.find((x) => notSameAsFeatured(x));
  if (other) {
    return {
      url: other.url,
      alt: String(other.n.altText ?? node.name ?? ""),
      kind: other.kind,
    };
  }

  return null;
}

/**
 * Extra gallery stills for PDP — skips featured image duplicates and video assets.
 * @param {Record<string, unknown>} node
 * @param {string} featuredUrl
 * @returns {Array<{ url: string; alt: string }>}
 */
function pickGalleryExtraPhotos(node, featuredUrl) {
  const rawNodes = node?.galleryImages?.nodes ?? [];
  const nodes = rawNodes.filter((n) => galleryNodeUrl(n));
  if (!nodes.length) return [];

  const feat = normalizeUrlForDedupe(featuredUrl);

  return nodes
    .map((n) => {
      const url = galleryNodeUrl(n);
      return {
        url,
        alt: String(n.altText ?? node.name ?? ""),
        norm: normalizeUrlForDedupe(url),
        kind: kindFromGalleryNode(n, url),
      };
    })
    .filter((x) => x.kind !== "video" && (!feat || x.norm !== feat))
    .map(({ url, alt }) => ({ url, alt }));
}

/** Map API node → UI product card model */
export function mapProductNode(node) {
  if (!node) return null;
  const img = node.featuredImage?.node;
  const { price, rawPrice } = pickPrice(node);
  const name = String(node.name ?? "");
  const attrColors = colorOptionsFromAttributes(node);
  const featuredUrl = img?.sourceUrl ? String(img.sourceUrl) : "";
  const slugStr = node.slug ? String(node.slug) : "";
  const frontendHover = getFrontendHoverVideo(slugStr);
  const hover = frontendHover
    ? {
        url: frontendHover.url,
        alt: "",
        kind: frontendHover.kind,
      }
    : pickGalleryHover(node, featuredUrl);
  return {
    id: String(node.databaseId ?? node.id ?? node.name),
    slug: node.slug ? String(node.slug) : "",
    name: node.name,
    displayName: glowBearCardName(name),
    price,
    rawPrice,
    imageUrl: featuredUrl,
    imageAlt: img?.altText ?? node.name,
    swatches: swatchLabelsForProduct(name, attrColors, slugStr),
    ...(hover
      ? {
          hoverMediaUrl: hover.url,
          hoverMediaAlt: hover.alt,
          hoverMediaKind: hover.kind,
        }
      : {}),
  };
}

function mapCategoryBlock(cat) {
  if (!cat) return null;
  const nodes = cat.products?.nodes ?? [];
  let products = nodes.map(mapProductNode).filter(Boolean);
  const slug = cat.slug ? String(cat.slug) : "";
  if (slug === CATEGORY_SLUGS["Essential Glow Bear"]) {
    products = sortEssentialGlowBearProducts(products);
  }
  const prices = products
    .map((p) => {
      const r = p.rawPrice;
      const n = typeof r === "string" || typeof r === "number" ? Number(r) : NaN;
      return Number.isNaN(n) ? null : n;
    })
    .filter((n) => n != null);
  const minPrice =
    prices.length > 0 ? Math.min(.../** @type {number[]} */ (prices)) : null;
  const frontendImage = getFrontendCategoryImage(slug);
  return {
    name: cat.name,
    description: cat.description ? htmlToPlainText(cat.description) : "",
    slug,
    lifestyleImageUrl:
      frontendImage?.url ?? cat.image?.sourceUrl ?? null,
    lifestyleImageAlt:
      frontendImage?.alt ?? cat.image?.altText ?? cat.name,
    products,
    minPriceFormatted:
      minPrice != null
        ? new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: storeCurrency(),
          }).format(minPrice)
        : null,
  };
}

/** Single variable product row (Classic Glow Bear). */
function mapClassicVariableProduct(node) {
  if (!node) return null;
  const img = node.featuredImage?.node;
  const { price } = pickPrice(node);
  const description = htmlToPlainText(node.description ?? "");
  const swatches = colorOptionsFromAttributes(node);
  return {
    name: node.name,
    description,
    slug: node.slug ? String(node.slug) : "",
    lifestyleImageUrl: img?.sourceUrl ?? null,
    lifestyleImageAlt: img?.altText ?? node.name,
    products: [],
    minPriceFormatted: price,
    swatches,
  };
}

function buildProductBySlugQuery(slug) {
  const safe = String(slug).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `
  query ProductBySlug {
    product(id: "${safe}", idType: SLUG) {
      __typename
      databaseId
      slug
      name
      description
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      galleryImages(first: 24) {
        nodes {
          ... on MediaItem {
            sourceUrl
            mediaItemUrl
            altText
            mimeType
          }
        }
      }
      productCategories {
        nodes {
          slug
          name
        }
      }
      ... on SimpleProduct {
        formattedPrice: price
        rawPrice: price(format: RAW)
        downloadable
        virtual
      }
      ... on VariableProduct {
        formattedPrice: price
        rawPrice: price(format: RAW)
        variations(first: 100) {
          nodes {
            databaseId
            formattedPrice: price
            rawPrice: price(format: RAW)
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
      ... on ProductWithAttributes {
        attributes {
          nodes {
            name
            label
            options
          }
        }
      }
    }
  }
`;
}

/**
 * @param {string} slug
 */
export async function getProductBySlug(slug) {
  const json = await fetchAPI(buildProductBySlugQuery(slug));
  return json;
}

/**
 * @param {Record<string, unknown> | null | undefined} node
 */
export function mapProductDetail(node) {
  if (!node) return null;
  const img = node.featuredImage?.node;
  const { price } = pickPrice(node);
  const vars = node.variations?.nodes;
  const variationAttributeDefinitions = mapVariationAttributeDefinitions(node);
  const variations = Array.isArray(vars)
    ? vars.map((v) => {
        const attrs = v.attributes?.nodes ?? [];
        const attributeValues = attrs
          .map((a) => ({
            name: String(a.name ?? ""),
            value: String(a.value ?? ""),
          }))
          .filter((a) => a.name && a.value);
        const colorLike = primaryVariationAttribute(attrs);
        const label =
          (colorLike?.value && String(colorLike.value)) ||
          attributeValues
            .map((a) => a.value)
            .filter(Boolean)
            .join(" · ") ||
          "Option";
        const imgNode = v.featuredImage?.node;
        const flatImg = v.image;
        const imageUrl =
          (imgNode?.sourceUrl && String(imgNode.sourceUrl)) ||
          (typeof flatImg?.sourceUrl === "string" ? flatImg.sourceUrl : "") ||
          "";
        const imageAlt =
          (imgNode?.altText && String(imgNode.altText)) ||
          (typeof flatImg?.altText === "string" ? flatImg.altText : "") ||
          `${label}, ${node.name}`;
        return {
          id: String(v.databaseId),
          price: pickPrice(v).price,
          label,
          imageUrl,
          imageAlt,
          attributeValues,
        };
      })
    : [];
  const catNodes =
    node.productCategories?.nodes ??
    node.categories?.nodes ??
    [];
  const categorySlugs = Array.isArray(catNodes)
    ? catNodes.map((c) => c?.slug).filter(Boolean)
    : [];

  const featuredUrl = img?.sourceUrl ? String(img.sourceUrl) : "";

  return {
    name: node.name,
    slug: node.slug ? String(node.slug) : "",
    databaseId:
      node.databaseId != null && node.databaseId !== ""
        ? Number(node.databaseId)
        : 0,
    descriptionHtml: node.description ?? "",
    imageUrl: featuredUrl,
    imageAlt: img?.altText ?? node.name,
    priceLabel: price,
    productType: node.__typename,
    colorOptions: colorOptionsFromAttributes(node),
    variationAttributes: variationAttributeDefinitions,
    variations,
    categorySlugs,
    galleryImages: pickGalleryExtraPhotos(node, featuredUrl),
    downloadable: Boolean(node.downloadable),
    virtual: Boolean(node.virtual),
  };
}

/** Other products in the Essential Glow Bear category (for PDP cross-links). */
function buildGlowBearBundleSiblingsQuery() {
  const catSlug = CATEGORY_SLUGS["Essential Glow Bear"];
  return `
  query GlowBearBundleSiblings {
    glowBearBundle: productCategory(id: "${catSlug}", idType: SLUG) {
      name
      products(first: 24) {
        nodes {
          slug
          name
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;
}

/**
 * @param {string} excludeSlug — current product slug to omit
 * @returns {Promise<Array<{ slug: string; name: string; imageUrl: string; imageAlt: string }>>}
 */
export async function getGlowBearBundleSiblings(excludeSlug) {
  const json = await fetchAPI(buildGlowBearBundleSiblingsQuery());
  const nodes = json?.data?.glowBearBundle?.products?.nodes ?? [];
  const ex = String(excludeSlug || "");
  return sortEssentialGlowBearProducts(
    nodes
      .filter((n) => n?.slug && String(n.slug) !== ex)
      .map((n) => ({
        slug: String(n.slug),
        name: n.name ?? "",
        displayName: glowBearCardName(String(n.name ?? "")),
        imageUrl: n.featuredImage?.node?.sourceUrl ?? "",
        imageAlt: n.featuredImage?.node?.altText ?? n.name ?? "",
      }))
  );
}

/**
 * Single product category for shop collection pages (shared fields with homepage rows).
 * @param {string} slug
 */
function buildProductCategoryBySlugQuery(slug) {
  const safe = String(slug).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `
  fragment CollectionProductFields on Product {
    slug
    databaseId
    name
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    galleryImages(first: 24) {
      nodes {
        ... on MediaItem {
          sourceUrl
          mediaItemUrl
          altText
          mimeType
        }
      }
    }
    ... on SimpleProduct {
      formattedPrice: price
      rawPrice: price(format: RAW)
    }
    ... on VariableProduct {
      formattedPrice: price
      rawPrice: price(format: RAW)
    }
    ... on ProductWithAttributes {
      attributes {
        nodes {
          name
          label
          options
        }
      }
    }
  }

  query ProductCategoryCollection {
    productCategory(id: "${safe}", idType: SLUG) {
      databaseId
      name
      description
      slug
      image {
        sourceUrl
        altText
      }
      products(first: 24) {
        nodes {
          ...CollectionProductFields
        }
      }
    }
  }
`;
}

/**
 * @param {string} slug — WooCommerce product category slug (e.g. essential-glow-bear)
 * @returns {Promise<ReturnType<typeof mapCategoryBlock> | null>}
 */
export async function getProductCategoryCollection(slug) {
  const json = await fetchAPI(buildProductCategoryBySlugQuery(slug));
  let block = mapCategoryBlock(json?.data?.productCategory);

  if (!block && json?.errors?.length) {
    const fallback = await fetchAPI(HOMEPAGE_COLLECTIONS_BY_NAME_QUERY);
    const cats = fallback?.data?.categories?.nodes ?? [];
    const needle =
      slug === CATEGORY_SLUGS["Essential Glow Bear"]
        ? "Essential Glow Bear"
        : slug === CATEGORY_SLUGS["Glow Bow Charms"]
          ? "Glow Bow Charms"
          : null;
    if (needle) {
      const match = cats.find((c) =>
        c?.name?.toLowerCase().includes(needle.toLowerCase())
      );
      block = mapCategoryBlock(match);
    }
  }

  return block;
}

/**
 * Fetch all WooCommerce categories that have at least one product.
 * @returns {Promise<Array<NonNullable<ReturnType<typeof mapCategoryBlock>>>>}
 */
export async function getShopCategoryBlocks() {
  const json = await fetchAPI(buildAllShopCategoriesQuery());
  const nodes = json?.data?.productCategories?.nodes ?? [];

  return sortShopCategoryBlocks(
    nodes
      .map(mapCategoryBlock)
      .filter(
        (block) =>
          block &&
          block.slug &&
          isShopCollectionSlugVisible(block.slug) &&
          block.products.length > 0
      )
  );
}

/**
 * @returns {Promise<string[]>}
 */
export async function getShopCategorySlugs() {
  const blocks = await getShopCategoryBlocks();
  return blocks.map((block) => block.slug);
}

export function categoryFallbackDescription(slug) {
  return (
    CATEGORY_FALLBACK_DESCRIPTIONS[slug] ??
    "Handmade crochet and gift-ready pieces from Studio Amrita."
  );
}

/**
 * Fetch normalized homepage / shop rows for every storefront category.
 */
export async function getHomepageCollections() {
  const blocks = await getShopCategoryBlocks();

  return {
    errors: null,
    rows: blocks.map((block) => ({
      key: block.slug,
      categoryName: block.name,
      layoutType: "grid",
      shopHref: `/shop/${block.slug}`,
      shopLabel: shopLabelForCategory(block.name),
      displayPrice: block.minPriceFormatted ?? "",
      fallbackDescription: categoryFallbackDescription(block.slug),
      data: block,
    })),
  };
}

export {
  CATEGORY_SLUGS,
  classicGlowBearSlug,
  isProductVisible,
  isShopCollectionSlugVisible,
  visibleShopCollectionSlugs,
};
