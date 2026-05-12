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
