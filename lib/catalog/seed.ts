import { assertCatalogProductsValid } from "./validate";
import { CATALOG_CURRENCY, type CatalogProduct } from "./types";

export const CATALOG_PRODUCTS = [
  {
    id: "p_batik_camp_shirt",
    slug: "batik-camp-collar-shirt",
    name: "Batik Camp Collar Shirt",
    description:
      "Lightweight camp-collar shirt in a batik-inspired print; relaxed fit that works tucked or untucked.",
    category: "tops",
    image: "/products/batik-camp-collar-shirt.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 15900 },
    availableSizes: ["S", "M", "L", "XL"],
    stripePriceId: "price_test_batik_camp_shirt_myr",
  },
  {
    id: "p_oversized_graphic_tee",
    slug: "oversized-graphic-tee",
    name: "Oversized Graphic Tee",
    description:
      "Soft cotton tee with a boxy, oversized cut for warm days and easy layering.",
    category: "tops",
    image: "/products/oversized-graphic-tee.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 7900 },
    availableSizes: ["XS", "S", "M", "L", "XL"],
    stripePriceId: "price_test_oversized_graphic_tee_myr",
  },
  {
    id: "p_linen_relaxed_trousers",
    slug: "linen-relaxed-trousers",
    name: "Linen Relaxed Trousers",
    description:
      "Breathable linen-blend trousers with an easy taper and drawstring waist.",
    category: "bottoms",
    image: "/products/linen-relaxed-trousers.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 13900 },
    availableSizes: ["XS", "S", "M", "L", "XL"],
    stripePriceId: "price_test_linen_relaxed_trousers_myr",
  },
  {
    id: "p_pleated_midi_skirt",
    slug: "pleated-midi-skirt",
    name: "Pleated Midi Skirt",
    description:
      "Flowy midi skirt with sharp pleats and a smooth waistband for a clean silhouette.",
    category: "bottoms",
    image: "/products/pleated-midi-skirt.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 12900 },
    availableSizes: ["XS", "S", "M", "L", "XL"],
    stripePriceId: "price_test_pleated_midi_skirt_myr",
  },
  {
    id: "p_utility_denim_jacket",
    slug: "utility-denim-jacket",
    name: "Utility Denim Jacket",
    description:
      "Midweight denim jacket with roomy pockets and a relaxed, slightly cropped shape.",
    category: "outerwear",
    image: "/products/utility-denim-jacket.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 19900 },
    availableSizes: ["S", "M", "L", "XL"],
    stripePriceId: "price_test_utility_denim_jacket_myr",
  },
  {
    id: "p_chiffon_shawl",
    slug: "everyday-chiffon-shawl",
    name: "Everyday Chiffon Shawl",
    description:
      "Light, drapey chiffon shawl with a soft hand-feel and easy everyday styling.",
    category: "accessories",
    image: "/products/everyday-chiffon-shawl.svg",
    price: { currency: CATALOG_CURRENCY, unitAmountSen: 5900 },
    availableSizes: ["XS", "S", "M", "L", "XL"],
    stripePriceId: "price_test_everyday_chiffon_shawl_myr",
  },
] as const satisfies readonly CatalogProduct[];

assertCatalogProductsValid(CATALOG_PRODUCTS);
