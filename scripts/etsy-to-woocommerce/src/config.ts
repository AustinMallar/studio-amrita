import { config as loadEnv } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CategoryMap } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

loadEnv({ path: join(ROOT, ".env") });

export const PATHS = {
  root: ROOT,
  data: join(ROOT, "data"),
  exportFile: join(ROOT, "data", "etsy-export.json"),
  reportFile: join(ROOT, "data", "import-report.csv"),
  categoryMap: join(ROOT, "category-map.json"),
  categoryRules: join(ROOT, "category-rules.json"),
  tokens: join(ROOT, ".etsy-tokens.json"),
};

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function loadCategoryMap(): CategoryMap {
  if (!existsSync(PATHS.categoryMap)) {
    throw new Error(`Category map not found: ${PATHS.categoryMap}`);
  }
  const raw = JSON.parse(readFileSync(PATHS.categoryMap, "utf8")) as Record<
    string,
    CategoryMapEntry | string
  >;
  const map: CategoryMap = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (key.startsWith("_")) continue;
    if (typeof entry === "object" && entry.wc_slug && entry.wc_name) {
      map[key] = entry;
    }
  }
  return map;
}

type CategoryMapEntry = { wc_slug: string; wc_name: string };

export const ETSY_API = "https://openapi.etsy.com/v3/application";
export const ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";

export const WC_DEFAULT_STATUS = optionalEnv("WC_DEFAULT_STATUS") ?? "draft";
export const WC_CURRENCY = optionalEnv("WC_CURRENCY") ?? "CAD";
/** When Etsy CSV/API reports 0 qty per variation, use this stock level. */
export const WC_DEFAULT_VARIATION_STOCK = Number(
  optionalEnv("WC_DEFAULT_VARIATION_STOCK") ?? "10"
);

export const ETSY_SCOPES = ["listings_r", "shops_r"];
