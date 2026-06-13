import "server-only";

import { wpGraphQL } from "./wp-graphql";

export type DownloadableItemView = {
  id: string;
  name: string;
  productName: string;
  productSlug: string;
  fileLabel: string;
  downloadUrl: string;
  downloadsRemaining: string | null;
  accessExpires: string | null;
};

const CUSTOMER_DOWNLOADS_QUERY = `
  query StudioAmritaCustomerDownloads {
    customer {
      downloadableItems(first: 50) {
        nodes {
          downloadId
          name
          downloadsRemaining
          accessExpires
          product {
            name
            slug
          }
          download {
            name
            file
            filePathType
          }
        }
      }
    }
  }
`;

function woocommerceStoreUrl(): string {
  const raw =
    process.env.WOOCOMMERCE_URL?.trim() ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_URL?.trim() ||
    process.env.WORDPRESS_API_URL?.trim() ||
    "";
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return raw.replace(/\/graphql\/?$/i, "").replace(/\/$/, "");
  }
}

/** Turn WooCommerce download file paths into browser-ready URLs. */
export function resolveDownloadFileUrl(
  file: string | null | undefined,
  filePathType?: string | null
): string {
  const f = file?.trim() ?? "";
  if (!f) return "";
  if (/^https?:\/\//i.test(f)) return f;
  if (filePathType === "absolute_path") return "";
  const base = woocommerceStoreUrl();
  if (!base) return f;
  return `${base}${f.startsWith("/") ? f : `/${f}`}`;
}

function mapDownloadableNode(node: Record<string, unknown> | null | undefined): DownloadableItemView | null {
  if (!node) return null;
  const download = node.download as Record<string, unknown> | null | undefined;
  const product = node.product as { name?: string; slug?: string } | null | undefined;
  const file = download?.file != null ? String(download.file) : "";
  const downloadUrl = resolveDownloadFileUrl(
    file,
    download?.filePathType != null ? String(download.filePathType) : null
  );
  if (!downloadUrl) return null;

  const id =
    node.downloadId != null && String(node.downloadId).length > 0
      ? String(node.downloadId)
      : `${product?.slug ?? "item"}-${file}`;

  return {
    id,
    name: String(node.name ?? download?.name ?? product?.name ?? "Download"),
    productName: String(product?.name ?? node.name ?? "Product"),
    productSlug: String(product?.slug ?? ""),
    fileLabel: String(download?.name ?? node.name ?? "PDF"),
    downloadUrl,
    downloadsRemaining:
      node.downloadsRemaining != null ? String(node.downloadsRemaining) : null,
    accessExpires:
      node.accessExpires != null && String(node.accessExpires).length > 0
        ? String(node.accessExpires)
        : null,
  };
}

export async function fetchCustomerDownloadables(authToken: string) {
  const result = await wpGraphQL<{
    customer?: {
      downloadableItems?: {
        nodes?: Array<Record<string, unknown> | null> | null;
      } | null;
    } | null;
  }>(CUSTOMER_DOWNLOADS_QUERY, undefined, null, authToken);

  const nodes = result.data?.customer?.downloadableItems?.nodes ?? [];
  const items = nodes
    .map((n) => mapDownloadableNode(n))
    .filter((x): x is DownloadableItemView => x != null);

  return {
    items,
    errors: result.errors,
    sessionHeader: result.sessionHeader,
  };
}
