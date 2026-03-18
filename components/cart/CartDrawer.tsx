"use client";

import * as React from "react";
import { useCart } from "./CartContext";
import { formatMoneySen } from "./format";

export function CartDrawer() {
  const { isOpen, closeCart, items, subtotalSen } = useCart();

  const locale = React.useMemo(() => getCheckoutLocale(), []);
  const t = React.useMemo(() => getCheckoutMessages(locale), [locale]);

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  const isEmpty = items.length === 0;

  async function onCheckout() {
    if (isEmpty || isCheckingOut) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const err = await safeParseCheckoutError(res);
        setCheckoutError(localizeCheckoutError(t, err));
        return;
      }

      const data = (await res.json()) as unknown;
      const url =
        data && typeof data === "object" && typeof (data as { url?: unknown }).url === "string"
          ? (data as { url: string }).url
          : null;

      if (!url) {
        setCheckoutError(t.genericError);
        return;
      }

      window.location.assign(url);
    } catch {
      setCheckoutError(t.genericError);
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={
        "fixed inset-0 z-50 " +
        (isOpen ? "pointer-events-auto" : "pointer-events-none")
      }
    >
      <div
        className={
          "absolute inset-0 bg-black/40 transition-opacity " +
          (isOpen ? "opacity-100" : "opacity-0")
        }
        onClick={closeCart}
      />
      <aside
        data-testid="cart-drawer"
        className={
          "absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform dark:bg-black " +
          (isOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
            <div className="text-lg font-semibold text-black dark:text-white">Cart</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-black/70 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
              onClick={closeCart}
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {isEmpty ? (
              <div className="text-sm text-black/60 dark:text-white/60">Your cart is empty.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    size={item.size}
                    quantity={item.quantity}
                    unitAmountSen={item.unitAmountSen}
                    currency={item.currency}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/70 dark:text-white/70">Subtotal</span>
              <span className="font-semibold text-black dark:text-white">
                {items.length ? formatMoneySen(items[0].currency, subtotalSen) : formatMoneySen("myr", 0)}
              </span>
            </div>
            <button
              data-testid="cart-checkout"
              type="button"
              disabled={isEmpty || isCheckingOut}
              className={
                "mt-3 w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors " +
                (isEmpty
                  ? "cursor-not-allowed bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40"
                  : isCheckingOut
                    ? "cursor-wait bg-black text-white opacity-80 dark:bg-white dark:text-black"
                    : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90")
              }
              onClick={onCheckout}
            >
              {isCheckingOut ? t.loading : t.checkout}
            </button>
            <div
              data-testid="checkout-error"
              aria-live="polite"
              className={
                checkoutError
                  ? "mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  : "hidden"
              }
            >
              {checkoutError ?? ""}
            </div>
            <div className="mt-2 text-xs text-black/50 dark:text-white/50">
              Subtotal is display-only. Final charges are computed server-side.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

type CheckoutLocale = "en" | "bm";

function getCheckoutLocale(): CheckoutLocale {
  if (typeof document === "undefined") return "en";
  const lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  if (lang === "bm" || lang.startsWith("ms")) return "bm";
  return "en";
}

function getCheckoutMessages(locale: CheckoutLocale) {
  const messages = {
    en: {
      checkout: "Checkout",
      loading: "Redirecting...",
      genericError: "Checkout failed. Please try again.",
      invalidCart: "Your cart looks invalid. Please refresh and try again.",
      invalidProduct: "One of your items is no longer available.",
      invalidSize: "Selected size is no longer available.",
      sessionFailed: "Unable to start checkout. Please try again.",
      configMissing: "Checkout is temporarily unavailable.",
    },
    bm: {
      checkout: "Bayar",
      loading: "Mengalihkan...",
      genericError: "Pembayaran gagal. Sila cuba lagi.",
      invalidCart: "Troli anda tidak sah. Sila muat semula dan cuba lagi.",
      invalidProduct: "Salah satu item anda tidak lagi tersedia.",
      invalidSize: "Saiz yang dipilih tidak lagi tersedia.",
      sessionFailed: "Tidak dapat memulakan pembayaran. Sila cuba lagi.",
      configMissing: "Pembayaran sementara tidak tersedia.",
    },
  } as const;

  return messages[locale];
}

type CheckoutApiError = {
  code?: string;
  message?: string;
};

async function safeParseCheckoutError(res: Response): Promise<CheckoutApiError> {
  try {
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return {};
    const obj = data as { code?: unknown; message?: unknown };
    return {
      code: typeof obj.code === "string" ? obj.code : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined,
    };
  } catch {
    return {};
  }
}

function localizeCheckoutError(
  t: ReturnType<typeof getCheckoutMessages>,
  err: CheckoutApiError,
): string {
  switch (err.code) {
    case "INVALID_CART":
      return t.invalidCart;
    case "INVALID_PRODUCT":
      return t.invalidProduct;
    case "INVALID_SIZE":
      return t.invalidSize;
    case "STRIPE_SESSION_FAILED":
      return t.sessionFailed;
    case "STRIPE_CONFIG_MISSING":
      return t.configMissing;
    default:
      return t.genericError;
  }
}

function CartItemRow(props: {
  itemKey: string;
  name: string;
  size: string;
  quantity: number;
  unitAmountSen: number;
  currency: string;
}) {
  const { inc, dec, remove } = useCart();
  const lineTotalSen = props.unitAmountSen * props.quantity;

  return (
    <div
      data-testid="cart-item"
      className="rounded-lg border border-black/10 p-3 dark:border-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-black dark:text-white">
            {props.name}
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">Size: {props.size}</div>
        </div>
        <div className="shrink-0 text-sm font-semibold text-black dark:text-white">
          {formatMoneySen(props.currency, lineTotalSen)}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-black/15 text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            onClick={() => dec(props.itemKey)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div className="w-8 text-center text-sm text-black dark:text-white">{props.quantity}</div>
          <button
            type="button"
            className="h-8 w-8 rounded-md border border-black/15 text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            onClick={() => inc(props.itemKey)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
          onClick={() => remove(props.itemKey)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
