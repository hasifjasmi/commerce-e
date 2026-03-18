"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CATALOG_PRODUCTS,
  type CatalogProduct,
  type CatalogProductSize,
} from "@/lib/catalog";
import { useCart } from "@/components/cart/CartContext";
import { formatMoneySen } from "@/components/cart/format";

export default function Home() {
  const { openCart } = useCart();
  const router = useRouter();
  const [showCancelBanner, setShowCancelBanner] = React.useState(false);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setShowCancelBanner(params.get("checkout") === "cancel");
    } catch {
      setShowCancelBanner(false);
    }
  }, []);

  return (
    <div data-testid="home-page" className="min-h-screen">
      <main data-testid="home-main" className="mx-auto max-w-5xl px-4 py-10">
        <section data-testid="hero" className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
          {showCancelBanner ? (
            <div
              data-testid="checkout-cancel-banner"
              role="status"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <div>
                Checkout cancelled. No charges were made.
              </div>
              <button
                data-testid="dismiss-cancel-banner"
                type="button"
                className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                onClick={() => {
                  setShowCancelBanner(false);
                  router.replace("/");
                }}
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Megz
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-black/70 dark:text-white/70">
            Sizes-only cart demo: pick a size, add items, and your cart persists in localStorage.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              data-testid="jump-to-catalog"
              type="button"
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              onClick={() => {
                const el = document.getElementById("catalog");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore catalog
            </button>
            <button
              data-testid="cart-button"
              type="button"
              className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold text-black hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              onClick={openCart}
            >
              View cart
            </button>
          </div>
          <p
            data-testid="purchase-confirmation-note"
            className="mt-3 max-w-2xl text-xs text-black/60 dark:text-white/60"
          >
            After purchase, we will send your confirmation via WhatsApp or Telegram.
          </p>
        </section>

        <section id="catalog" data-testid="catalog" className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">Catalog</h2>
            <div className="text-xs text-black/60 dark:text-white/60">
              {CATALOG_PRODUCTS.length} products
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATALOG_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t border-black/10 pt-6 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
          After purchase, we will send your confirmation via WhatsApp or Telegram.
        </footer>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { addToCart } = useCart();
  const sizes = product.availableSizes;

  const [selectedSize, setSelectedSize] = React.useState<CatalogProductSize | "">(
    sizes.length === 1 ? sizes[0] : "",
  );
  const [needsSize, setNeedsSize] = React.useState(false);

  const hasSize = selectedSize !== "";

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
      <div className="relative h-44 overflow-hidden rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="text-sm font-semibold text-black dark:text-white">{product.name}</div>
      <div className="mt-2 line-clamp-3 text-xs text-black/70 dark:text-white/70">
        {product.description}
      </div>
      <div className="mt-3 text-sm font-semibold text-black dark:text-white">
        {formatMoneySen(product.price.currency, product.price.unitAmountSen)}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-black/70 dark:text-white/70">
          Size
        </label>
        {sizes.length === 1 ? (
          <div className="mt-1 rounded-md border border-black/10 px-3 py-2 text-sm text-black dark:border-white/10 dark:text-white">
            {sizes[0]}
          </div>
        ) : (
          <select
            className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
            value={selectedSize}
            onChange={(e) => {
              setSelectedSize(e.target.value as CatalogProductSize);
              setNeedsSize(false);
            }}
          >
            <option value="">Select a size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {needsSize ? (
          <div data-testid="size-required" role="alert" className="mt-2 text-xs text-red-600">
            Please select a size.
          </div>
        ) : null}
      </div>

      <button
        data-testid="add-to-cart"
        type="button"
        className="mt-5 w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        onClick={() => {
          if (!hasSize) {
            setNeedsSize(true);
            return;
          }
          addToCart(product, selectedSize as CatalogProductSize);
        }}
      >
        Add to cart
      </button>
    </div>
  );
}
