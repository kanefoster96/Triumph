/**
 * Where payment goes.
 *
 * Nothing here talks to Stripe yet, and that is the point: enrolling somebody
 * and charging them are two separate steps in this product, so the seam
 * between them exists before the integration does. The button in the requests
 * inbox says "coming soon" out loud rather than pretending.
 *
 * When it is wired up, only this file and the two lines it is called from
 * should change:
 *
 *   1. `startCheckout` creates a Stripe Checkout session for that application
 *      and returns its URL, which the button redirects to.
 *   2. Stripe's webhook writes `paid_at` and `stripe_checkout_id` onto the
 *      application — the columns are already sketched in the migration.
 *   3. `paymentStateFor` reads those columns instead of returning "unwired".
 *
 * Deliberately free of React and Next imports so it can move to the app, and
 * free of any price: Dean builds a plan per person, so what somebody pays
 * is a number he sets on their application, not a tier they picked.
 */

export type PaymentState =
  /** No payment provider connected. Every application looks like this today. */
  | { status: "unwired" }
  | { status: "awaiting"; checkoutUrl: string }
  | { status: "paid"; paidAt: string };

export interface CheckoutRequest {
  applicationId: string;
  email: string;
  fullName: string;
  /** In pence, so there is never a float in a money figure. */
  amount: number;
  currency: "gbp";
}

/** True once a payment provider is configured. */
export function isPaymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * What we know about money on an application.
 *
 * Takes the application's own payment columns so the caller does not have to
 * know which provider is behind it.
 */
export function paymentStateFor(application: { paidAt?: string | null }): PaymentState {
  if (application.paidAt) return { status: "paid", paidAt: application.paidAt };
  return { status: "unwired" };
}

/**
 * Start a checkout. Throws until a provider is connected — a stub that
 * silently succeeded would be worse than one that says it is a stub.
 */
export async function startCheckout(request: CheckoutRequest): Promise<{ url: string }> {
  throw new Error(
    `No payment provider is connected yet, so ${request.fullName}'s checkout cannot start. ` +
      "See src/lib/services/payments.ts.",
  );
}
