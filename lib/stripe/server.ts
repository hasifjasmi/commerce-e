import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  if (!stripeClient) {
    const apiVersion = (process.env.STRIPE_API_VERSION ?? "2025-08-27.basil") as Stripe.LatestApiVersion;
    stripeClient = new Stripe(secretKey, {
      apiVersion,
    });
  }

  return stripeClient;
}
