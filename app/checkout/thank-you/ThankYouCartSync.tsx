"use client";

import { useEffect } from "react";

/** Clear headless cart UI after payment (Woo session is already empty on the server). */
export function ThankYouCartSync() {
  useEffect(() => {
    void fetch("/api/cart", { credentials: "include", cache: "no-store" }).then(() => {
      window.dispatchEvent(new Event("cart:updated"));
    });
  }, []);
  return null;
}
