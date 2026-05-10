<?php
/**
 * Link prior guest orders to a new account when the billing email matches.
 *
 * WooCommerce stores guest checkout with customer ID 0. Registering later does not attach
 * those orders automatically — this snippet assigns them so they appear under My Account /
 * WPGraphQL customer.orders.
 *
 * Install: Code Snippets → Add snippet → paste this file → Run everywhere → Activate,
 * or copy to wp-content/mu-plugins/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'user_register', 'studio_amrita_link_guest_orders_on_register', 20, 1 );
add_action( 'woocommerce_created_customer', 'studio_amrita_link_guest_orders_on_register', 20, 1 );
/** Also run on login so orders link if this snippet was added after the user already existed. */
add_action( 'wp_login', 'studio_amrita_link_guest_orders_on_login', 10, 2 );

/**
 * @param int|string $user_id WordPress user ID (woocommerce_created_customer passes int).
 */
function studio_amrita_link_guest_orders_on_register( $user_id ) {
	$uid = absint( $user_id );
	if ( $uid < 1 ) {
		return;
	}

	// woocommerce_created_customer also fires during checkout registration — same handler is fine.
	studio_amrita_assign_guest_orders_by_email( $uid );
}

/**
 * @param string   $user_login Username.
 * @param WP_User $user       User object.
 */
function studio_amrita_link_guest_orders_on_login( $user_login, $user ) {
	unset( $user_login );
	if ( ! $user instanceof WP_User ) {
		return;
	}
	studio_amrita_assign_guest_orders_by_email( (int) $user->ID );
}

/**
 * Find guest orders (customer 0) with this billing email and attach to the user.
 *
 * @param int $user_id WordPress user ID.
 */
function studio_amrita_assign_guest_orders_by_email( $user_id ) {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return;
	}

	$user = get_userdata( $user_id );
	if ( ! $user || ! is_email( $user->user_email ) ) {
		return;
	}

	$email_norm = strtolower( trim( $user->user_email ) );

	$orders = wc_get_orders(
		array(
			'limit'         => -1,
			'customer'      => 0,
			'billing_email' => $user->user_email,
			'return'        => 'objects',
			'status'        => 'any',
		)
	);

	if ( empty( $orders ) ) {
		return;
	}

	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		if ( (int) $order->get_customer_id() !== 0 ) {
			continue;
		}

		$bill = strtolower( trim( (string) $order->get_billing_email() ) );
		if ( $bill !== $email_norm ) {
			continue;
		}

		$order->set_customer_id( $user_id );
		$order->save();
	}
}
