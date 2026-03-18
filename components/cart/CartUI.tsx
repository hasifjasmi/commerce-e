"use client";

import * as React from "react";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "./CartContext";

export function CartUI() {
  const { openCart, totalQuantity } = useCart();

  return (
    <>
      <button
        data-testid="cart-open"
        type="button"
        className="fixed right-4 top-4 z-40 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        onClick={openCart}
      >
        Cart{totalQuantity ? ` (${totalQuantity})` : ""}
      </button>
      <CartDrawer />
    </>
  );
}
