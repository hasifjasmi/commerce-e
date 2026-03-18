import { CATALOG_CURRENCY } from "@/lib/catalog";

export function formatMoneySen(currency: string, amountSen: number): string {
  const amount = amountSen / 100;

  if (currency === CATALOG_CURRENCY) {
    return `RM ${amount.toFixed(2)}`;
  }

  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}
