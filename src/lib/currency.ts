import { ExchangeRates } from "./types";

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || "";
const CACHE_KEY = "wealth_exchange_rates";
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours
const DISPLAY_CURRENCY_KEY = "wealth_display_currency";

export async function fetchExchangeRates(
  base: string = "USD"
): Promise<ExchangeRates> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached) as ExchangeRates & { fetchedAt: number };
    if (
      Date.now() - parsed.fetchedAt < CACHE_DURATION &&
      parsed.base === base
    ) {
      return parsed;
    }
  }

  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`
  );

  if (!res.ok) {
    // Return cached data even if expired, or fallback rates
    if (cached) return JSON.parse(cached);
    return { base, rates: { USD: 1, SGD: 1.35 }, lastUpdated: new Date().toISOString() };
  }

  const data = await res.json();
  const rates: ExchangeRates = {
    base: data.base_code,
    rates: data.conversion_rates,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ ...rates, fetchedAt: Date.now() })
  );

  return rates;
}

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

export function formatCurrency(
  amount: number,
  currencyCode: string,
  compact: boolean = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 0,
    notation: compact && Math.abs(amount) >= 10000 ? "compact" : "standard",
  }).format(amount);
}

export function getDisplayCurrency(): string {
  return localStorage.getItem(DISPLAY_CURRENCY_KEY) || "SGD";
}

export function setDisplayCurrency(code: string): void {
  localStorage.setItem(DISPLAY_CURRENCY_KEY, code);
}
