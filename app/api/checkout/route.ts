import { CATALOG_PRODUCTS, type CatalogProduct, type CatalogProductSize } from "@/lib/catalog";
import { getStripeClient } from "@/lib/stripe/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

type CheckoutItemInput = {
  productId: string;
  size: string;
  quantity: number;
};

type CheckoutPayload = {
  items: CheckoutItemInput[];
};

const MAX_QUANTITY = 10;
const MIN_QUANTITY = 1;
const MAX_ITEMS = 24;
const MAX_METADATA_CART_LENGTH = 480;

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_QUANTITY &&
    value <= MAX_QUANTITY
  );
}

function getBaseUrl(request: Request): string | null {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (isNonEmptyString(envSiteUrl)) {
    try {
      const u = new URL(envSiteUrl);
      if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    } catch {
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (isNonEmptyString(vercelUrl)) {
    try {
      const u = new URL(`https://${vercelUrl}`);
      return u.origin;
    } catch {
    }
  }

  try {
    const origin = new URL(request.url);
    const host = origin.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return origin.origin;
    }
    return process.env.NODE_ENV === "production" ? null : origin.origin;
  } catch {
    return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
  }
}

function buildCartMetadata(items: CheckoutItemInput[]): string {
  const parts: string[] = [];
  for (const item of items) {
    parts.push(`${item.productId}:${item.size}:${item.quantity}`);
  }
  const joined = parts.join("|");
  return joined.length > MAX_METADATA_CART_LENGTH
    ? joined.slice(0, MAX_METADATA_CART_LENGTH)
    : joined;
}

export async function POST(request: Request) {
  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return jsonError(400, "INVALID_CART", "Request payload must be valid JSON.");
  }

  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    return jsonError(400, "INVALID_CART", "Cart must include at least one item.");
  }
  if (payload.items.length > MAX_ITEMS) {
    return jsonError(400, "INVALID_CART", `Cart cannot exceed ${MAX_ITEMS} items.`);
  }

  const catalogProducts: readonly CatalogProduct[] = CATALOG_PRODUCTS;
  const catalogMap = new Map<string, CatalogProduct>(
    catalogProducts.map((product) => [product.id, product]),
  );

  const lineItems: { price: string; quantity: number }[] = [];
  let cartCurrency: CatalogProduct["price"]["currency"] | null = null;

  for (const item of payload.items) {
    if (!isNonEmptyString(item?.productId) || !isNonEmptyString(item?.size)) {
      return jsonError(400, "INVALID_CART", "Each item must include productId and size.");
    }

    if (!isValidQuantity(item?.quantity)) {
      return jsonError(
        400,
        "INVALID_CART",
        `Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`,
      );
    }

    const product = catalogMap.get(item.productId);
    if (!product) {
      return jsonError(400, "INVALID_PRODUCT", "Product does not exist.");
    }

    if (!cartCurrency) {
      cartCurrency = product.price.currency;
    } else if (product.price.currency !== cartCurrency) {
      return jsonError(
        400,
        "MIXED_CURRENCY",
        "Cart must contain items in a single currency.",
      );
    }

    const size = item.size as CatalogProductSize;
    if (!product.availableSizes.includes(size)) {
      return jsonError(400, "INVALID_SIZE", "Selected size is not available.");
    }

    lineItems.push({ price: product.stripePriceId, quantity: item.quantity });
  }

  if (process.env.STRIPE_MOCK === "1") {
    return Response.json({ url: "https://checkout.stripe.com/mock" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(
      500,
      "STRIPE_CONFIG_MISSING",
      "Stripe configuration is missing on the server.",
    );
  }

  const baseUrl = getBaseUrl(request);
  if (!baseUrl) {
    return jsonError(500, "BASE_URL_UNAVAILABLE", "Public site URL is not configured.");
  }
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/?checkout=cancel`;

  const allowedCountriesEnv = process.env.STRIPE_ALLOWED_COUNTRIES ?? "";
  const parsedAllowedCountries = allowedCountriesEnv
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  const allowedCountries = parsedAllowedCountries.length > 0 ? parsedAllowedCountries : ["MY"];

  const shippingRateIdsEnv = process.env.STRIPE_SHIPPING_RATE_IDS ?? "";
  const shippingOptions = shippingRateIdsEnv
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^shr_[A-Za-z0-9]+$/.test(id))
    .map((id) => ({ shipping_rate: id }));

  const metadataItems = buildCartMetadata(payload.items);

  try {
    const stripe = getStripeClient();
    const sessionParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: { allowed_countries: allowedCountries },
      phone_number_collection: { enabled: true },
      ...(shippingOptions.length > 0 ? { shipping_options: shippingOptions } : {}),
      metadata: { cart: metadataItems },
    } as Stripe.Checkout.SessionCreateParams;

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return jsonError(500, "STRIPE_SESSION_FAILED", "Unable to start checkout.");
    }

    return Response.json({ url: session.url });
  } catch {
    return jsonError(500, "STRIPE_SESSION_FAILED", "Unable to start checkout.");
  }
}
