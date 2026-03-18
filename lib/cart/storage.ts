import type { CartLineItem } from "./types";

const CART_STORAGE_KEY = "commerce-e.cart.v1";

type PersistedCart = {
  items: Array<{
    productId: string;
    name: string;
    size: CartLineItem["size"];
    quantity: number;
    currency: CartLineItem["currency"];
    unitAmountSen: number;
  }>;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCartFromStorage(): PersistedCart | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const items = (parsed as { items?: unknown }).items;
    if (!Array.isArray(items)) return null;

    const safeItems: PersistedCart["items"] = [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;

      const productId = typeof obj.productId === "string" ? obj.productId : null;
      const name = typeof obj.name === "string" ? obj.name : null;
      const size = typeof obj.size === "string" ? (obj.size as PersistedCart["items"][number]["size"]) : null;
      const currency =
        typeof obj.currency === "string"
          ? (obj.currency as PersistedCart["items"][number]["currency"])
          : null;
      const unitAmountSen =
        typeof obj.unitAmountSen === "number" && Number.isInteger(obj.unitAmountSen)
          ? obj.unitAmountSen
          : null;
      const quantity =
        typeof obj.quantity === "number" && Number.isInteger(obj.quantity) ? obj.quantity : null;

      if (!productId || !name || !size || !currency || unitAmountSen == null || quantity == null) {
        continue;
      }
      if (unitAmountSen <= 0 || quantity <= 0) continue;

      safeItems.push({ productId, name, size, currency, unitAmountSen, quantity });
    }

    return { items: safeItems };
  } catch {
    return null;
  }
}

export function saveCartToStorage(items: PersistedCart["items"]): void {
  if (!isBrowser()) return;

  const payload: PersistedCart = { items };
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
}
