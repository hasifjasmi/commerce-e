"use client";

import * as React from "react";
import type { CatalogProduct, CatalogProductSize } from "@/lib/catalog";
import {
  CART_INITIAL_STATE,
  cartReducer,
  cartSubtotalSen,
  loadCartFromStorage,
  saveCartToStorage,
  type CartLineItem,
  type CartState,
} from "@/lib/cart";

type CartContextValue = {
  state: CartState;
  items: readonly CartLineItem[];
  isOpen: boolean;
  subtotalSen: number;
  totalQuantity: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: CatalogProduct, size: CatalogProductSize) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(cartReducer, CART_INITIAL_STATE);

  React.useEffect(() => {
    const persisted = loadCartFromStorage();
    dispatch({
      type: "CART_HYDRATE",
      payload: {
        items: persisted?.items ?? [],
      },
    });
  }, []);

  React.useEffect(() => {
    if (!state.hasHydrated) return;

    saveCartToStorage(
      state.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        size: i.size,
        quantity: i.quantity,
        currency: i.currency,
        unitAmountSen: i.unitAmountSen,
      })),
    );
  }, [state.hasHydrated, state.items]);

  const subtotalSen = React.useMemo(() => cartSubtotalSen(state.items), [state.items]);
  const totalQuantity = React.useMemo(() => {
    let q = 0;
    for (const item of state.items) q += item.quantity;
    return q;
  }, [state.items]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      state,
      items: state.items,
      isOpen: state.isOpen,
      subtotalSen,
      totalQuantity,
      openCart: () => dispatch({ type: "CART_OPEN" }),
      closeCart: () => dispatch({ type: "CART_CLOSE" }),
      toggleCart: () => dispatch({ type: "CART_TOGGLE" }),
      addToCart: (product, size) =>
        dispatch({
          type: "CART_ADD",
          payload: {
            productId: product.id,
            name: product.name,
            size,
            unitAmountSen: product.price.unitAmountSen,
            currency: product.price.currency,
          },
        }),
      inc: (key) => dispatch({ type: "CART_INC", payload: { key } }),
      dec: (key) => dispatch({ type: "CART_DEC", payload: { key } }),
      remove: (key) => dispatch({ type: "CART_REMOVE", payload: { key } }),
    }),
    [state, subtotalSen, totalQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within <CartProvider>.");
  }
  return ctx;
}
