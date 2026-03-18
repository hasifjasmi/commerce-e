"use client";

import * as React from "react";

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

type ApiError = { code?: string; message?: string };

type Lang = "en" | "bm";

const LANG_STORAGE_KEY = "admin_lang";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M2.5 12h19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 2c2.9 2.7 4.6 6.2 4.6 10s-1.7 7.3-4.6 10c-2.9-2.7-4.6-6.2-4.6-10S9.1 4.7 12 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function safeHttpHref(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildMessage(lang: Lang, details: StripeDetailsResponse | null) {
  if (!details) return "";

  const name = details.type === "checkout_session" ? details.customer_name : null;
  const salutation = name && name.trim().length > 0 ? name.trim() : lang === "bm" ? "" : "";

  const idLine =
    lang === "bm" ? `Rujukan Stripe: ${details.id}` : `Stripe ref: ${details.id}`;

  const itemsLines: string[] = [];
  if (details.type === "checkout_session" && Array.isArray(details.items) && details.items.length > 0) {
    for (const item of details.items) {
      const qty = item.quantity != null ? ` x${item.quantity}` : "";
      itemsLines.push(`- ${item.description}${qty}`);
    }
  }

  const amountMinor = details.type === "checkout_session" ? details.amount_total : details.amount;
  const money = formatMoneyMinor(details.currency, amountMinor);

  if (lang === "bm") {
    return [
      `Hai${salutation ? " " + salutation : ""}, terima kasih atas pesanan anda!`,
      "",
      "Pembayaran diterima.",
      idLine,
      itemsLines.length > 0 ? "Item:" : null,
      itemsLines.length > 0 ? itemsLines.join("\n") : null,
      `Jumlah: ${money}`,
      "",
      "Kami akan maklumkan butiran penghantaran sebentar lagi.",
    ]
      .filter((l): l is string => typeof l === "string")
      .join("\n");
  }

  return [
    `Hi${salutation ? " " + salutation : ""}, thanks for your order!`,
    "",
    "Payment received.",
    idLine,
    itemsLines.length > 0 ? "Items:" : null,
    itemsLines.length > 0 ? itemsLines.join("\n") : null,
    `Total: ${money}`,
    "",
    "We will follow up with shipping details shortly.",
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function AdminPage() {
  const [lang, setLang] = React.useState<Lang>("en");
  const [stripeId, setStripeId] = React.useState("");
  const [phoneOverride, setPhoneOverride] = React.useState("");
  const [telegramDestination, setTelegramDestination] = React.useState("");

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [details, setDetails] = React.useState<StripeDetailsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copyState, setCopyState] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "en" || stored === "bm") {
        setLang(stored);
      }
    } catch {
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
    }
  }, [lang]);

  const message = buildMessage(lang, details);

  const resolvedPhoneRaw = phoneOverride.trim().length > 0 ? phoneOverride.trim() : details?.phone ?? "";
  const waPhone = digitsOnly(resolvedPhoneRaw);
  const waLink = waPhone.length > 0 ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : "";

  const telegramHref = safeHttpHref(telegramDestination);

  async function fetchStripeDetails() {
    const trimmed = stripeId.trim();
    setStatus("loading");
    setError(null);
    setDetails(null);
    setCopyState(null);

    try {
      const res = await fetch("/api/admin/stripe-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trimmed }),
      });
      const data = (await res.json()) as StripeDetailsResponse | ApiError;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "Unable to fetch Stripe details.";
        throw new Error(msg);
      }

      if (!data || typeof data !== "object" || !("type" in data)) {
        throw new Error("Unexpected response.");
      }

      setDetails(data as StripeDetailsResponse);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <main data-testid="admin-page" className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
           <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
             Admin confirmation generator
           </h1>

           <div data-testid="lang-toggle" className="flex rounded-full border border-black/15 p-1 dark:border-white/15">
             <span
               aria-hidden="true"
               className="grid size-7 place-items-center rounded-full text-black/60 dark:text-white/70"
             >
               <GlobeIcon className="size-4" />
             </span>
             <button
               data-testid="lang-toggle-en"
               type="button"
               className={
                 lang === "en"
                  ? "rounded-full bg-black px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black"
                  : "rounded-full px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
              }
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              data-testid="lang-toggle-bm"
              type="button"
              className={
                lang === "bm"
                  ? "rounded-full bg-black px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black"
                  : "rounded-full px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
              }
              onClick={() => setLang("bm")}
            >
              BM
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-black/70 dark:text-white/70">
              Stripe ID
            </label>
            <input
              data-testid="stripe-id-input"
              value={stripeId}
              onChange={(e) => setStripeId(e.target.value)}
              placeholder="cs_... or pi_..."
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-black/70 dark:text-white/70">
              Phone override (optional)
            </label>
            <input
              data-testid="phone-override-input"
              value={phoneOverride}
              onChange={(e) => setPhoneOverride(e.target.value)}
              placeholder="e.g. 60123456789"
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            data-testid="fetch-details-button"
            type="button"
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            disabled={stripeId.trim().length === 0 || status === "loading"}
            onClick={() => void fetchStripeDetails()}
          >
            {status === "loading" ? "Fetching…" : "Fetch details"}
          </button>

          {status === "success" && details ? (
            <div data-testid="stripe-summary" className="text-xs text-black/60 dark:text-white/60">
              {details.type === "checkout_session" ? "Checkout session" : "Payment intent"}: {details.id}
            </div>
          ) : null}
        </div>

        {status === "error" ? (
          <div
            data-testid="admin-error"
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error ?? "Unable to fetch Stripe details."}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-6">
          <section data-testid="whatsapp-output" className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-black dark:text-white">WhatsApp</h2>
              <a
                data-testid="wa-link"
                href={waLink || undefined}
                target="_blank"
                rel="noreferrer"
                className={
                  waLink
                    ? "text-xs font-semibold text-black underline underline-offset-4 hover:opacity-80 dark:text-white"
                    : "text-xs font-semibold text-black/40 dark:text-white/40"
                }
              >
                {waLink ? "Open wa.me" : "No phone available"}
              </a>
            </div>

            <label className="mt-3 block text-xs font-semibold text-black/70 dark:text-white/70">
              Message
            </label>
            <textarea
              data-testid="whatsapp-message"
              value={message}
              readOnly
              rows={7}
              className="mt-1 w-full resize-y rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-xs text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                data-testid="copy-whatsapp-message"
                type="button"
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
                onClick={() =>
                  void (async () => {
                    const ok = await copyToClipboard(message);
                    setCopyState(ok ? "whatsapp" : "copy_failed");
                    window.setTimeout(() => setCopyState(null), 1200);
                  })()
                }
                disabled={message.length === 0}
              >
                Copy message
              </button>
              {copyState === "whatsapp" ? (
                <span data-testid="copy-whatsapp-ok" className="text-xs text-black/60 dark:text-white/60">
                  Copied
                </span>
              ) : null}
              {copyState === "copy_failed" ? (
                <span data-testid="copy-failed" className="text-xs text-red-700">
                  Copy failed
                </span>
              ) : null}
            </div>
          </section>

          <section data-testid="telegram-output" className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-black dark:text-white">Telegram</h2>
            </div>

            <label className="mt-3 block text-xs font-semibold text-black/70 dark:text-white/70">
              Destination link
            </label>
            <input
              data-testid="telegram-destination-input"
              value={telegramDestination}
              onChange={(e) => setTelegramDestination(e.target.value)}
              placeholder="https://t.me/..."
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
            />

            <label className="mt-3 block text-xs font-semibold text-black/70 dark:text-white/70">
              Message
            </label>
            <textarea
              data-testid="telegram-message"
              value={message}
              readOnly
              rows={7}
              className="mt-1 w-full resize-y rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-xs text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                data-testid="telegram-destination-link"
                href={telegramHref ?? undefined}
                target="_blank"
                rel="noreferrer"
                className={
                  telegramHref
                    ? "text-xs font-semibold text-black underline underline-offset-4 hover:opacity-80 dark:text-white"
                    : "text-xs font-semibold text-black/40 dark:text-white/40"
                }
              >
                {telegramHref ? "Open destination" : "Add destination link"}
              </a>
              <button
                data-testid="copy-telegram-message"
                type="button"
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
                onClick={() =>
                  void (async () => {
                    const ok = await copyToClipboard(message);
                    setCopyState(ok ? "telegram" : "copy_failed");
                    window.setTimeout(() => setCopyState(null), 1200);
                  })()
                }
                disabled={message.length === 0}
              >
                Copy message
              </button>
              {copyState === "telegram" ? (
                <span data-testid="copy-telegram-ok" className="text-xs text-black/60 dark:text-white/60">
                  Copied
                </span>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
