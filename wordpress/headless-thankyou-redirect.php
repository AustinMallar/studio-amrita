<?php
/**
 * Headless storefront: send order confirmation to the Next.js app.
 *
 * Install (pick one):
 *
 * - Code Snippets: New snippet → paste this entire file → scope "Run everywhere" (must run on
 *   the storefront for woocommerce_thankyou) → Save & Activate.
 *
 * - mu-plugin: copy this file to wp-content/mu-plugins/ (loads automatically).
 *
 * Configure your public storefront URL in wp-config.php (above "That's all, stop editing!"):
 *
 *   define( 'STUDIO_AMRITA_FRONTEND_URL', 'https://your-nextjs-site.com' );
 *
 * Or set the same name in the server environment.
 *
 * After PayPal returns to WooCommerce and the order-received page runs, the customer
 * is redirected to:
 * {STUDIO_AMRITA_FRONTEND_URL}/checkout/thank-you?order=ID&key=ORDER_KEY&email=BILLING_EMAIL
 * (email lets the frontend load order details via the WooCommerce Store API for guests.)
 *
 * Cross-domain wp_safe_redirect requires allowed_redirect_hosts (see filter below). Without it,
 * WordPress may send users to wp-login.php with redirect_to pointing at wp-admin.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'woocommerce_thankyou', 'studio_amrita_redirect_thankyou_to_headless', 5, 1 );

/**
 * @param int $order_id Order ID.
 */
function studio_amrita_redirect_thankyou_to_headless( $order_id ) {
	if ( ! $order_id || is_admin() || ( defined( 'DOING_AJAX' ) && DOING_AJAX ) || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	if ( wp_doing_cron() ) {
		return;
	}

	$base = studio_amrita_headless_frontend_url();
	if ( $base === '' ) {
		return;
	}

	$order = wc_get_order( (int) $order_id );
	if ( ! $order || ! is_a( $order, 'WC_Order' ) ) {
		return;
	}

	// Optional: add ?headless_stay=1 to the order-received URL to debug the WP page without redirect.
	if ( isset( $_GET['headless_stay'] ) && '1' === (string) $_GET['headless_stay'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	$args = array(
		'order' => (string) $order->get_id(),
		'key'   => $order->get_order_key(),
	);

	$billing_email = $order->get_billing_email();
	if ( is_string( $billing_email ) && $billing_email !== '' ) {
		$args['email'] = $billing_email;
	}

	$target = rtrim( $base, '/' ) . '/checkout/thank-you?' . http_build_query( $args, '', '&', PHP_QUERY_RFC3986 );

	wp_safe_redirect( $target, 302 );
	exit;
}

/**
 * @return string Base URL of the headless storefront, no trailing slash, or empty.
 */
function studio_amrita_headless_frontend_url() {
	if ( defined( 'STUDIO_AMRITA_FRONTEND_URL' ) && is_string( STUDIO_AMRITA_FRONTEND_URL ) && STUDIO_AMRITA_FRONTEND_URL !== '' ) {
		return rtrim( STUDIO_AMRITA_FRONTEND_URL, '/' );
	}
	$env = getenv( 'STUDIO_AMRITA_FRONTEND_URL' );
	if ( is_string( $env ) && $env !== '' ) {
		return rtrim( $env, '/' );
	}
	return '';
}

add_filter( 'allowed_redirect_hosts', 'studio_amrita_allow_headless_redirect_host', 10, 2 );

/**
 * Permit wp_safe_redirect() to the headless storefront hostname (different from this WP site).
 *
 * @param string[] $hosts           Allowed hosts for redirects.
 * @param string   $external_host   Host from the redirect target URL (unused; we trust STUDIO_AMRITA_FRONTEND_URL).
 * @return string[]
 */
function studio_amrita_allow_headless_redirect_host( $hosts, $external_host ) {
	unset( $external_host );

	$base = studio_amrita_headless_frontend_url();
	if ( $base === '' ) {
		return $hosts;
	}

	$parsed = wp_parse_url( $base );
	if ( empty( $parsed['host'] ) ) {
		return $hosts;
	}

	$headless_host = $parsed['host'];
	if ( ! in_array( $headless_host, $hosts, true ) ) {
		$hosts[] = $headless_host;
	}

	return $hosts;
}
