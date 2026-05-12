<?php
/**
 * Studio Amrita — WooCommerce transactional email styling (on-brand with Next.js storefront).
 *
 * Applies fonts and colors aligned with the headless site:
 *   Cream #f9f5f2, blush #f4eae8, dusty rose #e4a8a8, heading #5c4d4d, body text #8a7d7d
 *   Fonts: Jost (body), Quicksand (headings) via Google Fonts.
 *
 * Install:
 *   Copy to wp-content/mu-plugins/ (loads automatically), OR use Code Snippets → Run everywhere.
 *
 * Requires: WooCommerce active.
 *
 * Optional: WooCommerce → Settings → Emails → Upload a header image (logo). Recommended width ~240–320px.
 * Optional: Set footer text in WooCommerce → Settings → Emails for your tagline and legal links.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Append brand CSS after WooCommerce core email styles (runs through Emogrifier when available).
 *
 * @param string    $css   Full CSS string.
 * @param WC_Email $email Email instance.
 */
function studio_amrita_wc_email_brand_styles( $css, $email ) {
	unset( $email );

	$brand = <<<'CSS'


/* --- Studio Amrita brand (headless storefront alignment) --- */
@import url(https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,600;1,400&family=Quicksand:wght@600;700&display=swap);

html,
body {
	font-family: Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
	color: #8a7d7d !important;
}

#outer_wrapper {
	background-color: #f9f5f2 !important;
}

#inner_wrapper {
	background-color: #ffffff !important;
	border-radius: 16px !important;
	overflow: hidden !important;
	box-shadow: 0 1px 3px rgba(92, 77, 77, 0.06) !important;
}

#wrapper {
	padding: 48px 16px !important;
}

#template_container {
	border: 1px solid rgba(92, 77, 77, 0.1) !important;
	border-radius: 16px !important;
	overflow: hidden !important;
	background-color: #ffffff !important;
}

/* Accent stripe (PromoBar-inspired) */
#template_container {
	border-top: 4px solid #e4a8a8 !important;
}

#template_header {
	background-color: #f4eae8 !important;
	border-bottom: 1px solid rgba(92, 77, 77, 0.08) !important;
}

#template_header h1,
h1 {
	font-family: Quicksand, Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
	font-weight: 700 !important;
	color: #5c4d4d !important;
	letter-spacing: 0.02em !important;
	font-size: 26px !important;
	line-height: 1.25 !important;
	margin: 0 !important;
	padding: 24px 32px !important;
}

#template_header_image {
	padding: 28px 32px 12px !important;
	text-align: center !important;
	background-color: #f9f5f2 !important;
}

#template_header_image img {
	max-width: 220px !important;
	height: auto !important;
}

.email-logo-text {
	font-family: Quicksand, Jost, sans-serif !important;
	font-weight: 700 !important;
	font-size: 22px !important;
	color: #5c4d4d !important;
	margin: 16px 0 !important;
}

#body_content,
#body_content_inner {
	background-color: #ffffff !important;
}

#body_content_inner_cell {
	padding: 32px !important;
}

#body_content_inner,
#body_content_inner p,
#body_content_inner td {
	font-family: Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
	font-size: 15px !important;
	line-height: 1.65 !important;
	color: #8a7d7d !important;
}

#body_content_inner a {
	color: #c97f7f !important;
	font-weight: 600 !important;
	text-decoration: underline !important;
}

/* Order summary tables */
td,
th {
	font-family: Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
}

table.td,
td.td,
.td {
	border-color: rgba(92, 77, 77, 0.12) !important;
}

.address {
	border-radius: 12px !important;
	border: 1px solid rgba(92, 77, 77, 0.1) !important;
	padding: 16px !important;
	background-color: #f9f5f2 !important;
}

/* Buttons (Pay order, etc.) */
a.button,
.button,
#body_content_inner .button {
	display: inline-block !important;
	background-color: #e4a8a8 !important;
	color: #ffffff !important;
	font-family: Quicksand, Jost, sans-serif !important;
	font-weight: 700 !important;
	text-transform: uppercase !important;
	letter-spacing: 0.08em !important;
	font-size: 13px !important;
	padding: 14px 28px !important;
	border-radius: 999px !important;
	text-decoration: none !important;
	border: none !important;
}

a.button:hover,
.button:hover {
	background-color: #d89595 !important;
	color: #ffffff !important;
}

/* Footer */
#template_footer {
	background-color: #f9f5f2 !important;
	border-top: 1px solid rgba(92, 77, 77, 0.08) !important;
}

#template_footer td,
#credit {
	font-family: Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
	font-size: 13px !important;
	line-height: 1.6 !important;
	color: #8a7d7d !important;
}

#credit a {
	color: #c97f7f !important;
}

CSS;

	return $css . $brand;
}

add_filter( 'woocommerce_email_styles', 'studio_amrita_wc_email_brand_styles', 100, 2 );

/**
 * Optional: point header logo link at the Next.js storefront when defined.
 */
function studio_amrita_wc_email_header_link_url( $url ) {
	$front = studio_amrita_email_brand_frontend_url();
	return $front !== '' ? $front : $url;
}

/**
 * @return string Headless site origin, no trailing slash.
 */
function studio_amrita_email_brand_frontend_url() {
	if ( defined( 'STUDIO_AMRITA_FRONTEND_URL' ) && is_string( STUDIO_AMRITA_FRONTEND_URL ) && STUDIO_AMRITA_FRONTEND_URL !== '' ) {
		return rtrim( STUDIO_AMRITA_FRONTEND_URL, '/' );
	}
	$env = getenv( 'STUDIO_AMRITA_FRONTEND_URL' );
	return is_string( $env ) && $env !== '' ? rtrim( $env, '/' ) : '';
}

add_filter( 'woocommerce_email_header_image_url', 'studio_amrita_wc_email_header_link_url', 10, 1 );
