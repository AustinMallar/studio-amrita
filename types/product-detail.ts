export type ProductGalleryImage = {
  url: string;
  alt: string;
};

export type ProductVariationView = {
  id: string;
  label: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
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
  variations: ProductVariationView[];
  /** WooCommerce category slugs for this product */
  categorySlugs: string[];
  /** Additional stills from the WooCommerce product gallery (excludes featured + videos). */
  galleryImages: ProductGalleryImage[];
};
