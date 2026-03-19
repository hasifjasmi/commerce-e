import { type CatalogCurrency, type CatalogProductSize } from "@/lib/catalog";
import {
  cartLineItemKey,
  type CartLineItem,
  type CartState,
} from "./types";

export type CartAction =
  | { type: "CART_OPEN" }
  | { type: "CART_CLOSE" }
  | { type: "CART_TOGGLE" }
  | {
      type: "CART_HYDRATE";
      payload: {
        items: Array<{
          productId: string;
          name: string;
          size: CatalogProductSize;
          quantity: number;
          unitAmountSen: number;
          currency: CatalogCurrency;
        }>;
      };
    }
  | {
      type: "CART_ADD";
      payload: {
        productId: string;
        name: string;
        size: CatalogProductSize;
        unitAmountSen: number;
        currency: CatalogCurrency;
        quantity?: number;
      };
    }
  | { type: "CART_INC"; payload: { key: string } }
  | { type: "CART_DEC"; payload: { key: string } }
  | { type: "CART_REMOVE"; payload: { key: string } };

export const CART_INITIAL_STATE: CartState = {
  isOpen: false,
  items: [],
  hasHydrated: false,
};

const MAX_CART_QUANTITY = 10;

function upsertItem(
  items: readonly CartLineItem[],
  next: Omit<CartLineItem, "quantity"> & { quantity: number },
): readonly CartLineItem[] {
  const idx = items.findIndex((i) => i.key === next.key);
  if (idx === -1) return [...items, next];

  const existing = items[idx];
  const merged: CartLineItem = {
    ...existing,
    name: next.name,
    unitAmountSen: next.unitAmountSen,
    currency: next.currency,
    quantity: Math.min(existing.quantity + next.quantity, MAX_CART_QUANTITY),
  };
  return [...items.slice(0, idx), merged, ...items.slice(idx + 1)];
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "CART_OPEN":
      return { ...state, isOpen: true };
    case "CART_CLOSE":
      return { ...state, isOpen: false };
    case "CART_TOGGLE":
      return { ...state, isOpen: !state.isOpen };
    case "CART_HYDRATE": {
      const items: CartLineItem[] = action.payload.items
        .filter((i) => i.quantity > 0 && i.unitAmountSen > 0)
        .map((i) => ({
          key: cartLineItemKey(i.productId, i.size),
          productId: i.productId,
          name: i.name,
          size: i.size,
          quantity: Math.min(i.quantity, MAX_CART_QUANTITY),
          currency: i.currency,
          unitAmountSen: i.unitAmountSen,
        }));

      return {
        ...state,
        items,
        hasHydrated: true,
      };
    }
    case "CART_ADD": {
      const rawQty = action.payload.quantity ?? 1;
      const qty =
        typeof rawQty === "number" && Number.isInteger(rawQty)
          ? Math.min(Math.max(rawQty, 1), MAX_CART_QUANTITY)
          : 1;
      if (qty <= 0 || action.payload.unitAmountSen <= 0) return state;
      const key = cartLineItemKey(action.payload.productId, action.payload.size);

      const next: CartLineItem = {
        key,
        productId: action.payload.productId,
        name: action.payload.name,
        size: action.payload.size,
        quantity: qty,
        currency: action.payload.currency,
        unitAmountSen: action.payload.unitAmountSen,
      };

      return { ...state, isOpen: true, items: upsertItem(state.items, next) };
    }
    case "CART_INC": {
      const items = state.items.map((i) => {
        if (i.key !== action.payload.key) return i;
        if (i.quantity >= MAX_CART_QUANTITY) return i;
        return { ...i, quantity: i.quantity + 1 };
      });
      return { ...state, items };
    }
    case "CART_DEC": {
      const items = state.items
        .map((i) =>
          i.key === action.payload.key ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0);
      return { ...state, items };
    }
    case "CART_REMOVE": {
      const items = state.items.filter((i) => i.key !== action.payload.key);
      return { ...state, items };
    }
    default:
      return state;
  }
}
