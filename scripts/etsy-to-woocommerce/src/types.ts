/** Etsy listing image from batch includes. */
export type EtsyImage = {
  listing_image_id: number;
  rank: number;
  url_fullxfull?: string;
  url_570xN?: string;
  alt_text?: string | null;
};

/** Etsy inventory property value. */
export type EtsyPropertyValue = {
  property_id: number;
  property_name?: string;
  scale_id?: number | null;
  value_ids?: number[];
  values: string[];
};

export type EtsyOffering = {
  offering_id: number;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  is_enabled: boolean;
};

export type EtsyInventoryProduct = {
  product_id: number;
  sku?: string;
  property_values: EtsyPropertyValue[];
  offerings: EtsyOffering[];
};

export type EtsyInventory = {
  products: EtsyInventoryProduct[];
  price_on_property?: number[];
  quantity_on_property?: number[];
  sku_on_property?: number[];
};

export type EtsyListing = {
  listing_id: number;
  title: string;
  description?: string;
  state?: string;
  taxonomy_id: number;
  url?: string;
  tags?: string[];
  materials?: string[];
  price?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity?: number;
  images?: EtsyImage[];
  inventory?: EtsyInventory;
  /** CSV import: WooCommerce category slug override (column WC_CATEGORY_SLUG). */
  wc_category_slug?: string;
  /** CSV import: original row count when grouped as variations. */
  _csv_source_rows?: number;
};

/** Normalized export snapshot written to data/etsy-export.json */
export type EtsyExportSnapshot = {
  exported_at: string;
  shop_id: number;
  currency_code: string;
  listings: EtsyListing[];
};

export type CategoryMapEntry = {
  wc_slug: string;
  wc_name: string;
};

export type CategoryMap = Record<string, CategoryMapEntry>;

export type WooImagePayload = {
  src: string;
  name?: string;
  alt?: string;
  position?: number;
};

export type WooAttributePayload = {
  name: string;
  visible: boolean;
  variation: boolean;
  options: string[];
};

export type WooVariationPayload = {
  regular_price: string;
  sku: string;
  stock_quantity: number;
  manage_stock: boolean;
  attributes: Array<{ name: string; option: string }>;
  image?: WooImagePayload;
};

export type WooProductPayload = {
  name: string;
  slug: string;
  type: "simple" | "variable";
  status: string;
  description: string;
  regular_price?: string;
  sku?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  categories: Array<{ id: number }>;
  images: WooImagePayload[];
  tags?: Array<{ name: string }>;
  attributes?: WooAttributePayload[];
  meta_data: Array<{ key: string; value: string | number }>;
  variations?: WooVariationPayload[];
};

export type MappedListing = {
  listing_id: number;
  payload: WooProductPayload;
  warnings: string[];
  is_variable: boolean;
};

export type ImportReportRow = {
  etsy_listing_id: number;
  etsy_title: string;
  wc_product_id: number | "";
  wc_slug: string;
  action: "create" | "update" | "skip" | "dry-run";
  status: "ok" | "warning" | "error";
  warnings: string;
  errors: string;
};
