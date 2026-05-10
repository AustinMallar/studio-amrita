"use client";

import { imageFromCartProductNode } from "@/lib/cart-product-image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_COUNT = "studio-amrita-cart-item-count";
const STORAGE_PREVIEW = "studio-amrita-cart-preview";

export type CartLine = {
  key?: string;
  quantity?: number | null;
  subtotal?: string | null;
  name: string;
  imageUrl?: string;
  imageAlt?: string;
};

type CartContextValue = {
  itemCount: number;
  previewLines: CartLine[];
  previewTotal: string | null;
  /** WooCommerce cart shipping line (when returned by session). */
  previewShipping: string | null;
  /** True while GET /api/cart is in flight */
  loading: boolean;
  /** True until we need another GET (no cache or cart changed). */
  cartStale: boolean;
  refreshCart: () => Promise<void>;
  /** For hover: only hits the network when cartStale. */
  ensurePreviewFresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    let v = localStorage.getItem(STORAGE_COUNT);
    if (v == null) {
      v = sessionStorage.getItem(STORAGE_COUNT);
      if (v != null) {
        try {
          localStorage.setItem(STORAGE_COUNT, v);
        } catch {
          /* ignore */
        }
      }
    }
    if (v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function readStoredPreview(): {
  lines: CartLine[];
  total: string | null;
  shipping: string | null;
} | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(STORAGE_PREVIEW);
    if (raw == null) {
      raw = sessionStorage.getItem(STORAGE_PREVIEW);
      if (raw != null) {
        try {
          localStorage.setItem(STORAGE_PREVIEW, raw);
        } catch {
          /* ignore */
        }
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      lines?: CartLine[];
      total?: string | null;
      shipping?: string | null;
    };
    if (!parsed?.lines) return null;
    return {
      lines: parsed.lines,
      total: parsed.total ?? null,
      shipping: parsed.shipping ?? null,
    };
  } catch {
    return null;
  }
}

function writeStoredCount(ic: number): void {
  try {
    localStorage.setItem(STORAGE_COUNT, String(ic));
  } catch {
    /* ignore quota */
  }
}

function writeStoredPreview(
  lines: CartLine[],
  total: string | null,
  shipping: string | null
): void {
  try {
    localStorage.setItem(STORAGE_PREVIEW, JSON.stringify({ lines, total, shipping }));
  } catch {
    /* ignore quota */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(() => readStoredCount());
  const [previewLines, setPreviewLines] = useState<CartLine[]>(() => readStoredPreview()?.lines ?? []);
  const [previewTotal, setPreviewTotal] = useState<string | null>(() => readStoredPreview()?.total ?? null);
  const [previewShipping, setPreviewShipping] = useState<string | null>(() => readStoredPreview()?.shipping ?? null);
  const [loading, setLoading] = useState(false);
  /** When true, we need a GET /api/cart before showing trusted preview / count */
  const [cartStale, setCartStale] = useState(() => readStoredPreview() === null);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as {
        itemCount?: number;
        data?: {
          cart?: {
            contents?: {
              nodes?: Array<{
                key?: string;
                quantity?: number | null;
                subtotal?: string | null;
                product?: {
                  node?: {
                    name?: string | null;
                    featuredImage?: {
                      node?: { sourceUrl?: string | null; altText?: string | null } | null;
                    } | null;
                    image?: { sourceUrl?: string | null; altText?: string | null } | null;
                  } | null;
                } | null;
              } | null> | null;
            } | null;
            total?: string | null;
            shippingTotal?: string | null;
          } | null;
        };
      };

      const ic =
        typeof json.itemCount === "number"
          ? json.itemCount
          : (json.data?.cart?.contents?.nodes ?? []).reduce(
              (a, n) => a + (n?.quantity ?? 0),
              0
            );
      setItemCount(ic);
      writeStoredCount(ic);

      const nodes = json?.data?.cart?.contents?.nodes?.filter(Boolean) ?? [];
      const lines: CartLine[] = nodes.map((line) => {
        const node = line?.product?.node;
        const { imageUrl, imageAlt } = imageFromCartProductNode(node);
        return {
          key: line?.key,
          quantity: line?.quantity,
          subtotal: line?.subtotal,
          name: node?.name ?? "Product",
          ...(imageUrl ? { imageUrl, imageAlt } : {}),
        };
      });
      const total = json?.data?.cart?.total ?? null;
      const shipping =
        json?.data?.cart?.shippingTotal != null &&
        String(json.data.cart.shippingTotal).trim().length > 0
          ? String(json.data.cart.shippingTotal).trim()
          : null;
      setPreviewLines(lines);
      setPreviewTotal(total);
      setPreviewShipping(shipping);
      writeStoredPreview(lines, total, shipping);
      setCartStale(false);
    } catch {
      setCartStale(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function onCartUpdated() {
      void refreshCart();
    }
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [refreshCart]);

  const ensurePreviewFresh = useCallback(async () => {
    if (!cartStale) return;
    await refreshCart();
  }, [cartStale, refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      itemCount,
      previewLines,
      previewTotal,
      previewShipping,
      loading,
      cartStale,
      refreshCart,
      ensurePreviewFresh,
    }),
    [
      itemCount,
      previewLines,
      previewTotal,
      previewShipping,
      loading,
      cartStale,
      refreshCart,
      ensurePreviewFresh,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
