# WooCommerce email branding (Studio Amrita)

The Next.js storefront does **not** send order emails. WooCommerce on WordPress does. This folder adds **visual branding** so those emails match the site (cream/blush/dusty rose palette, Jost + Quicksand fonts).

## Install

1. Copy **`studio-amrita-woocommerce-email-branding.php`** to:
   - `wp-content/mu-plugins/`  
   **or**
   - Paste into **Code Snippets** → *Run everywhere* → Save & Activate.

2. In **WooCommerce → Settings → Emails**:
   - **Header image**: upload your logo (PNG/SVG-as-PNG; ~240–320px wide works well).
   - **Footer text**: optional shop tagline, address, unsubscribe/legal — plain text / HTML as Woo allows.

3. Define your storefront URL (same as other Studio Amrita snippets) so the logo links to the Next site:

   ```php
   define( 'STUDIO_AMRITA_FRONTEND_URL', 'https://your-nextjs-site.com' );
   ```

   Or set env `STUDIO_AMRITA_FRONTEND_URL` on the server.

## What it does

- Hooks **`woocommerce_email_styles`** (priority 100) and appends CSS that overrides WooCommerce’s default email appearance with your brand tokens (aligned with `app/globals.css` in this repo).
- Hooks **`woocommerce_email_header_image_url`** so the header logo links to the headless storefront when `STUDIO_AMRITA_FRONTEND_URL` is set.

## WooCommerce “Email improvements” / block emails

If you use WooCommerce’s newer email editor or block templates, core markup may differ slightly; the CSS uses broad selectors (`#template_header`, `#body_content_inner`, `.button`, etc.). If something doesn’t pick up after an WooCommerce upgrade, re-preview under **WooCommerce → Settings → Emails** and adjust selectors or open an issue with a screenshot.

## Updating WooCommerce

You do **not** need to copy `email-styles.php` from WooCommerce into your theme unless you want full template control. This mu-plugin survives WooCommerce updates; only rare markup changes would require CSS tweaks.
