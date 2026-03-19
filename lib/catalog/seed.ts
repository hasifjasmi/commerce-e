import { assertCatalogProductsValid } from "./validate";
import { type CatalogProduct } from "./types";

export const CATALOG_PRODUCTS = [
  {
    id: "prod_U6QGIIrceWGBq1",
    slug: "example-product-u6qgii",
    name: "Example Product",
    description: "Example Product",
    category: "accessories",
    image: "/products/everyday-chiffon-shawl.svg",
    price: { currency: "usd", unitAmountSen: 2000 },
    availableSizes: ["S", "M", "L", "XL"],
    stripePriceId: "price_1T8DPXRsGSLCkrVbjFIVHbZq",
  },
  {
    id: "prod_U6QFqaL5DIbYRt",
    slug: "example-product-u6qfqa",
    name: "Example Product",
    description: "Example Product",
    category: "accessories",
    image: "/products/everyday-chiffon-shawl.svg",
    price: { currency: "usd", unitAmountSen: 2000 },
    availableSizes: ["S", "M", "L", "XL"],
    stripePriceId: "price_1T8DOkRsGSLCkrVbCvYY7ncn",
  },
  {
    id: "prod_U6QEjSQskRg0JS",
    slug: "baju-tidur",
    name: "baju tidur",
    description: "baju tidur",
    category: "accessories",
    image: "/products/everyday-chiffon-shawl.svg",
    price: { currency: "myr", unitAmountSen: 6000 },
    availableSizes: ["S", "M", "L", "XL"],
    stripePriceId: "price_1T8DONRsGSLCkrVbFmULPvqz",
  },
] as const satisfies readonly CatalogProduct[];

assertCatalogProductsValid(CATALOG_PRODUCTS);
