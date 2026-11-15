import type { ExchangeRates } from "./types";

// Pure money helpers. No browser or Vite globals, so the MCP server can import them too.

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates.rates[fromCurrency] || !rates.rates[toCurrency]) return amount;

  // Convert to base first, then to target
  const inBase = amount / rates.rates[fromCurrency];
  return inBase * rates.rates[toCurrency];
}

/**
 * Symbols that never collide: "$" alone is ambiguous once SGD and USD sit side by side.
 */
const SYMBOLS: Record<string, string> = {
  SGD: "S$",
  USD: "US$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CNY: "CN¥",
  HKD: "HK$",
};

export function currencySymbol(currencyCode: string): string {
  return SYMBOLS[currencyCode] ?? `${currencyCode} `;
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  compact: boolean = false
): string {
  const useCompact = compact && Math.abs(amount) >= 10000;
  const digits = compact || currencyCode === "JPY" ? 0 : 2;
  const number = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: useCompact ? 1 : digits,
    minimumFractionDigits: useCompact ? 0 : digits,
    notation: useCompact ? "compact" : "standard",
  }).format(Math.abs(amount));
  const sign = amount < 0 && Math.abs(amount) >= 0.005 ? "-" : "";
  return `${sign}${currencySymbol(currencyCode)}${number}`;
}

