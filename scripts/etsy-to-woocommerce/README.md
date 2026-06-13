# Etsy → WooCommerce import

One-time migration tool: import active Etsy listings into WooCommerce as **drafts** for review.

**No Etsy API approval needed** — use the CSV path below (recommended if your developer app is still pending).

## Quick start (CSV — no API)

1. **Download your listings from Etsy**
   - Sign in at [etsy.com](https://www.etsy.com)
   - **Shop Manager → Settings → Options → Download Data**
   - Under **Currently for Sale Listings**, click **Download CSV**

2. **Configure WooCommerce** in `.env` (see [Setup](#setup))

3. **Run the import**

```bash
cd scripts/etsy-to-woocommerce
npm install
cp .env.example .env
# Edit .env — only WOOCOMMERCE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET required for CSV

npm run import-from-csv -- ~/Downloads/EtsyListingsDownload.csv --dry-run
npm run import-from-csv -- ~/Downloads/EtsyListingsDownload.csv
```

Optional: add a `WC_CATEGORY_SLUG` column to the CSV (`essential-glow-bear` or `glow-bow-charms`), or edit [`category-rules.json`](category-rules.json) to match titles automatically.

## Setup

1. Copy `.env.example` to `.env` and fill in credentials.
2. Register an app at [Etsy Developers](https://www.etsy.com/developers/) (see **Etsy app approval** below).
3. Create a WooCommerce REST API key (**Read/Write**) at **WooCommerce → Settings → Advanced → REST API**.
4. Map Etsy `taxonomy_id` values to your shop categories in [`category-map.json`](category-map.json).

```bash
cd scripts/etsy-to-woocommerce
npm install
cp .env.example .env
# edit .env
npm run auth          # OAuth once; saves refresh token
```

### Etsy app approval

OAuth will fail with **“The application … is not recognized”** until Etsy approves your app.

1. Go to [Manage your apps](https://www.etsy.com/developers/your-apps).
2. Open your app → **See API key details** → check **Status**. It must be **Approved** (not **Pending Approval**).
3. Under **Callback URLs**, add exactly: `http://localhost:3003/callback`
4. Copy **Keystring** → `ETSY_CLIENT_ID` and **Shared secret** → `ETSY_CLIENT_SECRET` in `.env`.

If status is **Pending Approval**, OAuth cannot work yet. Etsy reviews apps manually (often 1–3 days; sometimes longer). Tips that help approval:

- Fill in **name**, **description**, and **who will use the app** with real detail (e.g. “Personal tool to migrate my Studio Amrita shop listings to my WooCommerce store”).
- Set **Website URL** to your real site (e.g. `https://studioamrita.ca`).
- Select **non-commercial / personal use** if this is only for your own shop.

If pending for more than a few days, email [devel@etsy.com](mailto:devel@etsy.com) with your app name and that you need OAuth for a one-time catalog migration.

## Workflow (Etsy API)

Use this when your developer app is **Approved**:

```bash
npm run export                    # Etsy API → data/etsy-export.json
npm run import -- --dry-run
npm run import
```

## Workflow (CSV)

```bash
npm run import-from-csv -- path/to/listings.csv --dry-run
npm run import-from-csv -- path/to/listings.csv
npm run import-from-csv -- path/to/listings.csv --no-import   # only build etsy-export.json
```

### What the Etsy CSV includes

Per [Etsy Help](https://help.etsy.com/hc/en-us/articles/360000343508): title, description, price, currency, quantity, tags, materials, image URLs (`IMAGE1`…`IMAGE10`), SKU, and variation columns.

### CSV limitations vs API

| Data | CSV | API |
|------|-----|-----|
| Images | Yes (`IMAGE1`–`IMAGE10`) | Yes |
| Simple price/qty | Yes | Yes |
| Variations | Partial (see below) | Full per-variant price/qty |
| Category | Use `WC_CATEGORY_SLUG` column or `category-rules.json` | `category-map.json` taxonomy IDs |
| Listing ID | Optional column or parsed from URL | Yes |

**Variations:** If Etsy gives one row per color with different qty/price, the CSV handles that. If variations are comma-separated in `VARIATION_VALUES_1` (e.g. `Matcha,Sakura,Honey`), the importer expands them to a variable product with **equal stock split** — verify quantities in WooCommerce after import.

## Workflow (legacy)

Same as API workflow above. Options:

- `--listing-id 12345` — export or import a single listing
- `--dry-run` — import only; print mapping and write report without WooCommerce API writes

After export, check the printed **taxonomy_id** summary and update `category-map.json` before importing.

## Field mapping

| Etsy | WooCommerce |
|------|-------------|
| `title` | `name` |
| slugified title | `slug` (collision → `-etsy-{listing_id}`) |
| `description` | `description` (plain text wrapped in `<p>`) |
| `inventory.offerings[].price` | `regular_price` |
| `inventory.offerings[].quantity` | `stock_quantity` |
| `sku` or generated | `sku` (`etsy-listing-{id}` parent, `etsy-{listing}-{product}` variations) |
| `listing_id` | `_etsy_listing_id` meta (idempotent re-runs) |
| images by `rank` | `images[]` (sideloaded into WordPress media) |
| `taxonomy_id` | category via `category-map.json` |
| multiple inventory products | `variable` + `Color` (or other) attributes |

Re-running `npm run import` updates existing products matched by `_etsy_listing_id` meta or SKU `etsy-listing-{id}` only. **Existing WooCommerce products without those markers are never updated** (slug collisions get a `-etsy-{listing_id}` suffix).

### Restore a product overwritten by an earlier import

If a pre-existing product (e.g. Classic Glow Bear) was damaged by a bad import run:

1. **WooCommerce → Products → open the product → Browse revisions** (if available) and restore the previous version.
2. Remove incorrect `_etsy_listing_id` custom meta from that product if present.
3. Re-run `npm run import-from-csv` with the fixed script — each Etsy listing creates its own new draft product.

## QA checklist

Complete these checks before publishing products and enabling them on the Next.js storefront.

### WooCommerce (per product)

- [ ] Title, slug, and description match the Etsy listing
- [ ] Price is correct in **CAD** (including each variation)
- [ ] Stock quantities match Etsy
- [ ] Featured image and gallery count/order match Etsy
- [ ] Category slug is `essential-glow-bear` or `glow-bow-charms` (not Uncategorized)
- [ ] Variable products have the expected variation count and **Color** options
- [ ] `_etsy_listing_id` custom field is present (Products → product → Custom fields / meta)

### Storefront ([studio-amrita](../../))

- [ ] Product appears on `/shop/essential-glow-bear` or `/shop/glow-bow-charms`
- [ ] `/products/{slug}` shows gallery, price, and description
- [ ] Add-to-cart works for simple and variable products
- [ ] Colour swatches render (product title + Color attribute align with `lib/product-swatches.ts`)

### Publish

1. Bulk-select drafts in **WooCommerce → Products** and set status to **Published** (or add `WC_DEFAULT_STATUS=publish` for a second import pass).
2. In [`lib/api.js`](../../lib/api.js), set visibility flags when collections are ready:

```javascript
const SHOW_CLASSIC_GLOW_BEAR = true;
const SHOW_GLOW_BOW_CHARMS = true;
```

Category hero images are frontend overrides in [`lib/category-images.ts`](../../lib/category-images.ts); confirm category slugs match after import.

### Manual follow-up (not automated)

- WooCommerce shipping zones and rates (Etsy shipping profiles are not imported). Glow Bear products should use the **Glow Bear** shipping class (`glow-bear`) for free shipping within Canada — the importer assigns this automatically for glow-bear category listings.
- Processing times / policies (copy to product meta or site pages)
- Product weight and dimensions for shipping calculations
- Digital download files (if applicable)

## Security

- Never commit `.env`, `.etsy-tokens.json`, or `data/etsy-export.json`.
- Rotate WooCommerce API keys after migration.
- Run this tool locally or in a private CI job, not from the public Next.js app.

## Output files

| File | Purpose |
|------|---------|
| `data/etsy-export.json` | Local Etsy snapshot for re-import |
| `data/import-report.csv` | Per-listing actions, warnings, errors |
| `.etsy-tokens.json` | OAuth tokens (gitignored) |
