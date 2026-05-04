/** Shared cart line product shape from WooCommerce GraphQL (subset). */

export type CartProductNode = {
  name?: string | null;
  featuredImage?: {
    node?: { sourceUrl?: string | null; altText?: string | null } | null;
  } | null;
  /** Some product types (e.g. variations) expose a flat image field. */
  image?: { sourceUrl?: string | null; altText?: string | null } | null;
};

export function imageFromCartProductNode(
  node: CartProductNode | null | undefined
): { imageUrl: string; imageAlt: string } {
  if (!node) return { imageUrl: "", imageAlt: "" };
  const fi = node.featuredImage?.node;
  const flat = node.image;
  const url =
    (fi?.sourceUrl && String(fi.sourceUrl)) ||
    (flat?.sourceUrl && String(flat.sourceUrl)) ||
    "";
  const alt =
    (fi?.altText && String(fi.altText)) ||
    (flat?.altText && String(flat.altText)) ||
    (node.name && String(node.name)) ||
    "Product";
  return { imageUrl: url, imageAlt: alt };
}
