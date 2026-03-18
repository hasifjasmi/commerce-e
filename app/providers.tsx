"use client";

import * as React from "react";
import { CartProvider } from "@/components/cart/CartContext";
import { CartUI } from "@/components/cart/CartUI";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CartUI />
      {children}
    </CartProvider>
  );
}
