import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

type CheckoutSessionSummary = {
  id: string;
  status: string | null;
  payment_status: string | null;
  amount_total: number | null;
  currency: string | null;
  customer_name: string | null;
  items: Array<{
    description: string;
    quantity: number | null;
    amount_total: number | null;
    currency: string | null;
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId || sessionId.length === 0) {
    return jsonError(400, "MISSING_SESSION_ID", "Query param session_id is required.");
  }
  if (!sessionId.startsWith("cs_")) {
    return jsonError(400, "INVALID_SESSION_ID", "session_id must start with cs_.");
  }

  if (process.env.STRIPE_MOCK === "1") {
    const mocked: CheckoutSessionSummary = {
      id: sessionId,
      status: "complete",
      payment_status: "paid",
      amount_total: 0,
      currency: "myr",
      customer_name: "Test Customer",
      items: [],
    };
    return Response.json({ session: mocked });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(
      500,
      "STRIPE_CONFIG_MISSING",
      "Stripe configuration is missing on the server.",
    );
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 50 });

    const summary: CheckoutSessionSummary = {
      id: session.id,
      status: session.status ?? null,
      payment_status: session.payment_status ?? null,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      customer_name: session.customer_details?.name ?? null,
      items: (lineItems?.data ?? []).map((li) => ({
        description: li.description ?? "",
        quantity: li.quantity ?? null,
        amount_total: li.amount_total ?? null,
        currency: li.currency ?? session.currency ?? null,
      })),
    };

    return Response.json({ session: summary });
  } catch (err) {
    const message =
      typeof err === "object" && err && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
    if (message.toLowerCase().includes("no such checkout.session")) {
      return jsonError(404, "SESSION_NOT_FOUND", "Checkout session was not found.");
    }
    return jsonError(500, "STRIPE_SESSION_FETCH_FAILED", "Unable to fetch checkout session.");
  }
}
