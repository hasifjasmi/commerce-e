"use client";

import * as React from "react";
import Link from "next/link";

type SessionSummary = {
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

type ApiResponse =
  | { session: SessionSummary }
  | { code?: string; message?: string };

function formatMoneyMinor(currency: string | null, amountMinor: number | null) {
  if (!currency || amountMinor == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountMinor / 100);
  } catch {
    return `${currency.toUpperCase()} ${amountMinor / 100}`;
  }
}

export function SuccessView(props: { sessionId?: string } = {}) {
  const sessionId = props.sessionId;
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    sessionId ? "loading" : "idle",
  );
  const [session, setSession] = React.useState<SessionSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = sessionId;
    if (!id) return;

    let cancelled = false;

    async function run(sessionIdParam: string) {
      setStatus("loading");
      setError(null);

      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionIdParam)}`,
        );
        const data = (await res.json()) as ApiResponse;

        if (!res.ok || !(data as { session?: unknown }).session) {
          const message =
            data && typeof data === "object" && "message" in data && typeof data.message === "string"
              ? data.message
              : "Unable to load your checkout details.";
          throw new Error(message);
        }

        if (cancelled) return;
        setSession((data as { session: SessionSummary }).session);
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    }

    void run(id);
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main data-testid="success-page" className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Payment complete</h1>
        <p className="mt-3 text-sm text-black/70 dark:text-white/70">
          We will send your purchase confirmation via WhatsApp or Telegram shortly.
        </p>

        {!sessionId ? (
          <div data-testid="success-missing" className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Missing checkout session id.
          </div>
        ) : null}

        {status === "loading" ? (
          <div data-testid="success-loading" className="mt-6 text-sm text-black/60 dark:text-white/60">
            Loading checkout details…
          </div>
        ) : null}

        {status === "error" ? (
          <div
            data-testid="success-error"
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error ?? "Unable to load your checkout details."}
          </div>
        ) : null}

        {status === "success" && session ? (
          <div data-testid="success-summary" className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
            <div className="text-sm font-semibold text-black dark:text-white">Checkout summary</div>

            {session.customer_name ? (
              <div className="mt-2 text-sm text-black/70 dark:text-white/70">
                Thanks, <span data-testid="success-customer-name" className="font-semibold text-black dark:text-white">{session.customer_name}</span>.
              </div>
            ) : null}

            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-black/60 dark:text-white/60">Session</dt>
                <dd className="font-mono text-xs text-black dark:text-white" data-testid="success-session-id">
                  {session.id}
                </dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Total</dt>
                <dd className="font-semibold text-black dark:text-white" data-testid="success-total">
                  {formatMoneyMinor(session.currency, session.amount_total)}
                </dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Payment status</dt>
                <dd className="text-black dark:text-white" data-testid="success-payment-status">
                  {session.payment_status ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Session status</dt>
                <dd className="text-black dark:text-white" data-testid="success-session-status">
                  {session.status ?? "—"}
                </dd>
              </div>
            </dl>

            {Array.isArray(session.items) && session.items.length > 0 ? (
              <div className="mt-4" data-testid="success-items">
                <div className="text-xs font-semibold text-black/60 dark:text-white/60">Items</div>
                <div className="mt-2 space-y-2">
                  {session.items.map((item, idx) => (
                    <div key={idx} data-testid="success-item" className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate text-black dark:text-white">
                          {item.description || "Item"}
                        </div>
                        <div className="mt-0.5 text-xs text-black/60 dark:text-white/60">
                          Qty: {item.quantity ?? "—"}
                        </div>
                      </div>
                      <div className="shrink-0 font-semibold text-black dark:text-white">
                        {formatMoneyMinor(item.currency ?? session.currency, item.amount_total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            data-testid="success-back"
            href="/#catalog"
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Back to catalog
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
