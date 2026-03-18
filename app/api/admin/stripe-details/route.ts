import { getStripeClient } from "@/lib/stripe/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

type StripeLineItemSummary = {
  description: string;
  quantity: number | null;
  amount_total: number | null;
  currency: string | null;
};

type StripeDetailsResponse =
  | {
      type: "checkout_session";
      id: string;
      status: string | null;
      payment_status: string | null;
      created: number | null;
      amount_total: number | null;
      currency: string | null;
      customer_name: string | null;
      phone: string | null;
      payment_intent_id: string | null;
      items: StripeLineItemSummary[];
    }
  | {
      type: "payment_intent";
      id: string;
      status: string | null;
      created: number | null;
      amount: number | null;
      currency: string | null;
      phone: string | null;
      description: string | null;
    };

function summarizeLineItems(items: Stripe.ApiList<Stripe.LineItem> | null): StripeLineItemSummary[] {
  if (!items || !Array.isArray(items.data)) return [];
  return items.data
    .map((li) => ({
      description: li.description ?? "",
      quantity: li.quantity ?? null,
      amount_total: li.amount_total ?? null,
      currency: li.currency ?? null,
    }))
    .filter((li) => li.description.length > 0);
}

export async function POST(request: Request) {
  let payload: { id?: unknown };
  try {
    payload = (await request.json()) as { id?: unknown };
  } catch {
    return jsonError(400, "INVALID_REQUEST", "Request payload must be valid JSON.");
  }

  const id = payload?.id;
  if (!isNonEmptyString(id)) {
    return jsonError(400, "INVALID_ID", "Field id is required.");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(500, "STRIPE_CONFIG_MISSING", "Stripe configuration is missing on the server.");
  }

  const stripe = getStripeClient();

  try {
    if (id.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(id);

      let lineItems: Stripe.ApiList<Stripe.LineItem> | null = null;
      try {
        lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      } catch {
        lineItems = null;
      }

      const shippingPhone =
        (session as unknown as { shipping_details?: { phone?: string | null } | null }).shipping_details
          ?.phone ??
        (session as unknown as { collected_information?: { shipping_details?: { phone?: string | null } | null } | null })
          .collected_information?.shipping_details?.phone ??
        null;

      const phone = session.customer_details?.phone ?? shippingPhone;

      const response: StripeDetailsResponse = {
        type: "checkout_session",
        id: session.id,
        status: session.status ?? null,
        payment_status: session.payment_status ?? null,
        created: typeof session.created === "number" ? session.created : null,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        customer_name: session.customer_details?.name ?? null,
        phone,
        payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        items: summarizeLineItems(lineItems),
      };

      return Response.json(response);
    }

    if (id.startsWith("pi_")) {
      const intent = await stripe.paymentIntents.retrieve(id);
      const response: StripeDetailsResponse = {
        type: "payment_intent",
        id: intent.id,
        status: intent.status ?? null,
        created: typeof intent.created === "number" ? intent.created : null,
        amount: intent.amount ?? null,
        currency: intent.currency ?? null,
        phone: intent.shipping?.phone ?? null,
        description: intent.description ?? null,
      };
      return Response.json(response);
    }

    return jsonError(400, "INVALID_ID", "id must start with cs_ or pi_.");
  } catch (err) {
    const message =
      typeof err === "object" && err && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
    const lower = message.toLowerCase();
    if (lower.includes("no such checkout.session") || lower.includes("no such payment_intent")) {
      return jsonError(404, "STRIPE_NOT_FOUND", "Stripe object was not found.");
    }
    return jsonError(500, "STRIPE_FETCH_FAILED", "Unable to fetch Stripe details.");
  }
}
