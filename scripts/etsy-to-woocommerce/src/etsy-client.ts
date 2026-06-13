import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  ETSY_API,
  ETSY_TOKEN_URL,
  PATHS,
  requireEnv,
  optionalEnv,
} from "./config.js";
import { chunk, sleep, withRetry } from "./utils.js";
import type { EtsyImage, EtsyInventory, EtsyListing } from "./types.js";

type TokenFile = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export class EtsyClient {
  private accessToken: string | null = null;
  private refreshToken: string;
  private expiresAt = 0;

  constructor() {
    this.refreshToken = optionalEnv("ETSY_REFRESH_TOKEN") ?? "";
    if (existsSync(PATHS.tokens)) {
      const saved = JSON.parse(readFileSync(PATHS.tokens, "utf8")) as TokenFile;
      this.accessToken = saved.access_token;
      this.refreshToken = saved.refresh_token || this.refreshToken;
      this.expiresAt = saved.expires_at ?? 0;
    }
    if (!this.refreshToken) {
      throw new Error(
        "ETSY_REFRESH_TOKEN is missing. Run `npm run auth` to complete OAuth."
      );
    }
  }

  saveTokens(): void {
    if (!this.accessToken || !this.refreshToken) return;
    const data: TokenFile = {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.expiresAt,
    };
    writeFileSync(PATHS.tokens, JSON.stringify(data, null, 2));
  }

  async ensureAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.expiresAt > now + 60_000) {
      return this.accessToken;
    }
    const clientId = requireEnv("ETSY_CLIENT_ID");
    const clientSecret = requireEnv("ETSY_CLIENT_SECRET");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: this.refreshToken,
    });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(ETSY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body,
    });
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (!res.ok || !json.access_token) {
      throw new Error(
        `Etsy token refresh failed: ${json.error ?? res.statusText}`
      );
    }
    this.accessToken = json.access_token;
    if (json.refresh_token) this.refreshToken = json.refresh_token;
    this.expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
    this.saveTokens();
    return this.accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.ensureAccessToken();
    const url = new URL(`${ETSY_API}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
      }
    }
    return withRetry(async () => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": requireEnv("ETSY_CLIENT_ID"),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        const err = new Error(`Etsy API ${res.status} ${path}: ${text}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }
      return (await res.json()) as T;
    });
  }

  async getShopId(): Promise<number> {
    const fromEnv = optionalEnv("ETSY_SHOP_ID");
    if (fromEnv) return Number(fromEnv);
    const data = await this.request<{ results?: Array<{ shop_id: number }> }>(
      "/users/me/shops"
    );
    const shopId = data.results?.[0]?.shop_id;
    if (!shopId) throw new Error("Could not resolve Etsy shop_id");
    return shopId;
  }

  async fetchActiveListings(shopId: number): Promise<EtsyListing[]> {
    const listings: EtsyListing[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const data = await this.request<{
        count: number;
        results: EtsyListing[];
      }>(`/shops/${shopId}/listings`, {
        state: "active",
        limit: String(limit),
        offset: String(offset),
      });
      listings.push(...(data.results ?? []));
      offset += limit;
      if (offset >= data.count || !data.results?.length) break;
    }
    return listings;
  }

  async fetchListingImages(listingIds: number[]): Promise<Map<number, EtsyImage[]>> {
    const map = new Map<number, EtsyImage[]>();
    for (const batch of chunk(listingIds, 100)) {
      const data = await this.request<{
        results?: Array<EtsyListing & { images?: EtsyImage[] }>;
      }>("/listings/batch", {
        listing_ids: batch.join(","),
        includes: "Images",
      });
      for (const listing of data.results ?? []) {
        const images = [...(listing.images ?? [])].sort(
          (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
        );
        map.set(listing.listing_id, images);
      }
      await sleep(200);
    }
    return map;
  }

  async fetchListingInventory(listingId: number): Promise<EtsyInventory> {
    const data = await this.request<EtsyInventory>(
      `/listings/${listingId}/inventory`
    );
    return data;
  }

  async fetchAllInventory(
    listingIds: number[],
    concurrency = 3
  ): Promise<Map<number, EtsyInventory>> {
    const map = new Map<number, EtsyInventory>();
    let index = 0;
    const client = this;

    const worker = async (): Promise<void> => {
      while (index < listingIds.length) {
        const i = index++;
        const id = listingIds[i];
        const inventory = await client.fetchListingInventory(id);
        map.set(id, inventory);
        await sleep(150);
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, listingIds.length) },
      () => worker()
    );
    await Promise.all(workers);
    return map;
  }
}

export async function exchangeAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenFile> {
  const clientId = requireEnv("ETSY_CLIENT_ID");
  const clientSecret = requireEnv("ETSY_CLIENT_SECRET");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(ETSY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !json.access_token || !json.refresh_token) {
    throw new Error(`Etsy OAuth exchange failed: ${json.error ?? res.statusText}`);
  }
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}
