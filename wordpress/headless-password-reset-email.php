<?php
/**
 * Headless storefront: password reset emails link to Next.js instead of wp-login.php.
 *
 * Install (pick one):
 *
 * - Code Snippets: paste this file → "Run everywhere" → Save & Activate.
 * - mu-plugins: copy to wp-content/mu-plugins/
 *
 * Configure the public storefront base URL (same as thank-you redirect):
 *
 *   define( 'STUDIO_AMRITA_FRONTEND_URL', 'https://your-nextjs-site.com' );
 *
 * Emails will use: {STUDIO_AMRITA_FRONTEND_URL}/reset-password?key=…&login=…
 *
 * The Next.js app calls WPGraphQL `resetUserPassword` with those query parameters.
 *
 * Additionally, anyone who opens the old WordPress reset URL (cached email, bookmark, or mail
 * client that rewrote links) is redirected to the same Next.js URL — they never complete reset
 * on wp-login.php.
 *
 * WooCommerce sends reset emails to /my-account/{lost-password-endpoint}/?key=&id=&login= — not
 * wp-login.php. WooCommerce then redirects (template_redirect priority 10) to strip key from the
 * URL and use a cookie. We redirect to Next.js at priority 5 so that redirect never runs and the
 * customer completes reset on the headless app only.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return string Base URL of the headless storefront, no trailing slash, or empty.
 */
function studio_amrita_pwreset_frontend_base() {
	if ( defined( 'STUDIO_AMRITA_FRONTEND_URL' ) && is_string( STUDIO_AMRITA_FRONTEND_URL ) && STUDIO_AMRITA_FRONTEND_URL !== '' ) {
		return rtrim( STUDIO_AMRITA_FRONTEND_URL, '/' );
	}
	$env = getenv( 'STUDIO_AMRITA_FRONTEND_URL' );
	if ( is_string( $env ) && $env !== '' ) {
		return rtrim( $env, '/' );
	}
	return '';
}

/**
 * Replace core wp-login.php reset URL with the headless /reset-password route.
 *
 * @param string   $message    Email body.
 * @param string   $key        Reset key.
 * @param string   $user_login User login (username).
 * @param WP_User|\WP_Error|null $user_data User object when available (WP 5.7+).
 */
function studio_amrita_pwreset_rewrite_message( $message, $key, $user_login, $user_data = null ) {
	unset( $user_data );

	$base = studio_amrita_pwreset_frontend_base();
	if ( $base === '' || ! is_string( $key ) || $key === '' || ! is_string( $user_login ) || $user_login === '' ) {
		return $message;
	}

	$wp_url = network_site_url( 'wp-login.php?action=rp&key=' . $key . '&login=' . rawurlencode( $user_login ), 'login' );
	$headless = $base . '/reset-password?key=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user_login );

	if ( strpos( $message, $wp_url ) !== false ) {
		return str_replace( $wp_url, $headless, $message );
	}

	// Subdirectory installs or filtered `site_url` may differ slightly — fall back to regex.
	$pattern = '#https?://[^\s\r\n]+wp-login\.php\?[^\s\r\n]*action=rp[^\s\r\n]*#i';
	$replaced = preg_replace( $pattern, $headless, $message, 1 );
	return is_string( $replaced ) ? $replaced : $message;
}

add_filter( 'retrieve_password_message', 'studio_amrita_pwreset_rewrite_message', 10, 4 );

/**
 * Allow wp_safe_redirect() to the headless origin (different host than WordPress).
 *
 * @param string[] $hosts Allowed hosts.
 * @return string[]
 */
function studio_amrita_pwreset_allowed_redirect_hosts( $hosts ) {
	$base = studio_amrita_pwreset_frontend_base();
	if ( $base === '' ) {
		return $hosts;
	}
	$parsed = wp_parse_url( $base );
	if ( empty( $parsed['host'] ) ) {
		return $hosts;
	}
	$h = $parsed['host'];
	if ( ! in_array( $h, $hosts, true ) ) {
		$hosts[] = $h;
	}
	return $hosts;
}

add_filter( 'allowed_redirect_hosts', 'studio_amrita_pwreset_allowed_redirect_hosts', 10, 1 );

/**
 * Send password-reset landing traffic to Next.js instead of the wp-login.php reset form.
 *
 * Runs early on login_init so no WP reset UI is rendered for normal rp + key + login links.
 */
function studio_amrita_pwreset_redirect_login_rp_to_headless() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public GET link from email.
	if ( ! isset( $_GET['action'] ) || 'rp' !== (string) $_GET['action'] ) {
		return;
	}
	$key   = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : '';
	$login = isset( $_GET['login'] ) ? sanitize_text_field( wp_unslash( $_GET['login'] ) ) : '';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( $key === '' || $login === '' ) {
		return;
	}

	$base = studio_amrita_pwreset_frontend_base();
	if ( $base === '' ) {
		return;
	}

	$target = $base . '/reset-password?' . http_build_query(
		array(
			'key'   => $key,
			'login' => $login,
		),
		'',
		'&',
		PHP_QUERY_RFC3986
	);

	wp_safe_redirect( $target, 302 );
	exit;
}

add_action( 'login_init', 'studio_amrita_pwreset_redirect_login_rp_to_headless', 1 );

/**
 * Replace WooCommerce “lost password” endpoint URL with the Next.js reset route.
 *
 * WC emails use: add_query_arg( key, id, login, wc_get_endpoint_url( 'lost-password', … ) ).
 * Changing the base URL makes those emails point at the storefront; query args are unchanged.
 *
 * Bare links (“Forgot password?” with no token) go to /reset-password without params — the Next.js
 * page links users to /forgot-password.
 *
 * @param string $url       Generated URL.
 * @param string $endpoint  Endpoint slug (after WC internal mapping).
 * @param string $value     Endpoint value.
 * @param string $permalink Page permalink passed to wc_get_endpoint_url().
 */
function studio_amrita_pwreset_wc_endpoint_url( $url, $endpoint, $value, $permalink ) {
	unset( $value, $permalink );

	$lost_slug = get_option( 'woocommerce_myaccount_lost_password_endpoint', 'lost-password' );
	if ( (string) $endpoint !== (string) $lost_slug ) {
		return $url;
	}

	$base = studio_amrita_pwreset_frontend_base();
	if ( $base === '' ) {
		return $url;
	}

	return $base . '/reset-password';
}

/**
 * Redirect WooCommerce reset links to Next.js before WC strips query args into a cookie.
 *
 * @see WC_Form_Handler::redirect_reset_password_link() runs at template_redirect priority 10.
 */
function studio_amrita_pwreset_redirect_wc_account_reset_link() {
	if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- link from email.
	if ( ! isset( $_GET['key'] ) ) {
		return;
	}

	if ( ! isset( $_GET['login'] ) && ! isset( $_GET['id'] ) ) {
		return;
	}

	$key = sanitize_text_field( wp_unslash( $_GET['key'] ) );
	if ( $key === '' ) {
		return;
	}

	$login = '';
	if ( isset( $_GET['login'] ) ) {
		$login = sanitize_text_field( wp_unslash( $_GET['login'] ) );
	} elseif ( isset( $_GET['id'] ) ) {
		$user = get_user_by( 'id', absint( wp_unslash( $_GET['id'] ) ) );
		if ( $user ) {
			$login = $user->user_login;
		}
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( $login === '' ) {
		return;
	}

	$base = studio_amrita_pwreset_frontend_base();
	if ( $base === '' ) {
		return;
	}

	$target = $base . '/reset-password?' . http_build_query(
		array(
			'key'   => $key,
			'login' => $login,
		),
		'',
		'&',
		PHP_QUERY_RFC3986
	);

	wp_safe_redirect( $target, 302 );
	exit;
}

/** Priority 5: before WooCommerce redirect_reset_password_link() at priority 10. */
add_action( 'template_redirect', 'studio_amrita_pwreset_redirect_wc_account_reset_link', 5 );

/**
 * Register WooCommerce-specific hooks once WooCommerce is loaded.
 *
 * Uses plugins_loaded (not woocommerce_loaded) so this still runs if the snippet loads after WC.
 */
function studio_amrita_pwreset_register_wc_hooks() {
	static $registered = false;
	if ( $registered || ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	$registered = true;
	add_filter( 'woocommerce_get_endpoint_url', 'studio_amrita_pwreset_wc_endpoint_url', 10, 4 );
}

add_action( 'plugins_loaded', 'studio_amrita_pwreset_register_wc_hooks', 20 );
