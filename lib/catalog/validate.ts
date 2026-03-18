import { CATALOG_CURRENCY, type CatalogProduct } from "./types";

const ALLOWED_SIZES = new Set(["XS", "S", "M", "L", "XL"]);

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Catalog validation failed: ${label} must be a non-empty string.`);
  }
}

function assertPositiveInteger(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Catalog validation failed: ${label} must be a positive integer.`);
  }
}

export function assertCatalogProductsValid(
  products: readonly CatalogProduct[],
): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const product of products) {
    assertNonEmptyString(product.id, "product.id");
    assertNonEmptyString(product.slug, `product(${product.id}).slug`);
    assertNonEmptyString(product.name, `product(${product.id}).name`);
    assertNonEmptyString(product.description, `product(${product.id}).description`);
    assertNonEmptyString(product.image, `product(${product.id}).image`);

    if (ids.has(product.id)) {
      throw new Error(
        `Catalog validation failed: duplicate product.id '${product.id}'.`,
      );
    }
    if (slugs.has(product.slug)) {
      throw new Error(
        `Catalog validation failed: duplicate product.slug '${product.slug}'.`,
      );
    }
    ids.add(product.id);
    slugs.add(product.slug);

    assertNonEmptyString(
      product.stripePriceId,
      `product(${product.id}).stripePriceId`,
    );

    if (product.price.currency !== CATALOG_CURRENCY) {
      throw new Error(
        `Catalog validation failed: product(${product.id}).price.currency must be '${CATALOG_CURRENCY}'.`,
      );
    }
    assertPositiveInteger(
      product.price.unitAmountSen,
      `product(${product.id}).price.unitAmountSen`,
    );

    if (!Array.isArray(product.availableSizes) || product.availableSizes.length === 0) {
      throw new Error(
        `Catalog validation failed: product(${product.id}).availableSizes must be a non-empty array.`,
      );
    }

    for (const size of product.availableSizes) {
      if (typeof size !== "string" || !ALLOWED_SIZES.has(size)) {
        throw new Error(
          `Catalog validation failed: product(${product.id}).availableSizes contains invalid size '${String(size)}'.`,
        );
      }
    }
  }
}
