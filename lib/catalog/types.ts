export const CATALOG_CURRENCY = "myr" as const;
export const CATALOG_CURRENCIES = ["myr", "usd"] as const;
export type CatalogCurrency = (typeof CATALOG_CURRENCIES)[number];

export type CatalogProductSize =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL";

export type CatalogCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "dresses"
  | "accessories";

export type Money = {
  currency: CatalogCurrency;
  unitAmountSen: number;
};

export type CatalogImage = {
  src: string;
  alt: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CatalogCategory;
  image: string;
  price: Money;
  availableSizes: readonly CatalogProductSize[];
  stripePriceId: string;
  images?: readonly CatalogImage[];
  tags?: readonly string[];
};
