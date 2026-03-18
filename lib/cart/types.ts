import type { CatalogCurrency, CatalogProductSize } from "@/lib/catalog";

export type CartLineItemKey = string;

export type CartLineItem = {
  key: CartLineItemKey;
  productId: string;
  name: string;
  size: CatalogProductSize;
  quantity: number;
  currency: CatalogCurrency;
  unitAmountSen: number;
};

export type CartState = {
  isOpen: boolean;
  items: readonly CartLineItem[];
  hasHydrated: boolean;
};

export function cartLineItemKey(productId: string, size: CatalogProductSize): string {
  return `${productId}:${size}`;
}

export function cartSubtotalSen(items: readonly CartLineItem[]): number {
  let total = 0;
  for (const item of items) {
    total += item.unitAmountSen * item.quantity;
  }
  return total;
}
