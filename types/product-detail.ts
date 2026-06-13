export type ProductGalleryImage = {
  url: string;
  alt: string;
};

export type ProductVariationAttribute = {
  /** WooCommerce attribute slug (e.g. choose-your-glow). */
  name: string;
  label: string;
  options: string[];
};

export type ProductVariationAttributeValue = {
  name: string;
  value: string;
};

export type ProductVariationView = {
  id: string;
  label: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  attributeValues: ProductVariationAttributeValue[];
};

export type ProductDetailView = {
  name: string;
  slug: string;
  /** WooCommerce product database ID (required for add to cart). */
  databaseId: number;
  descriptionHtml: string;
  imageUrl: string;
  imageAlt: string;
  priceLabel: string;
  productType: string;
  colorOptions: string[];
  /** Variable-product attribute definitions for option dropdowns. */
  variationAttributes: ProductVariationAttribute[];
  variations: ProductVariationView[];
  /** WooCommerce category slugs for this product */
  categorySlugs: string[];
  /** Additional stills from the WooCommerce product gallery (excludes featured + videos). */
  galleryImages: ProductGalleryImage[];
  /** WooCommerce downloadable flag (e.g. PDF patterns). */
  downloadable: boolean;
  virtual: boolean;
};
