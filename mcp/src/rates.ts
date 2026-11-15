import type { ExchangeRates } from "../../src/lib/types";

const SIX_HOURS = 6 * 60 * 60 * 1000;

/** Same source and cache window as the web app (USD-based, 6 h). */
export function createRates(apiKey: string | undefined) {
  let cached: (ExchangeRates & { fetchedAt: number }) | null = null;

  return async function getRates(): Promise<ExchangeRates> {
    if (cached && Date.now() - cached.fetchedAt < SIX_HOURS) return cached;
    if (!apiKey) {
      if (cached) return cached;
      throw new Error("EXCHANGE_RATE_API_KEY is not set, so amounts cannot be converted");
    }
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
      if (!res.ok) throw new Error(`exchange rate API returned ${res.status}`);
      const data = (await res.json()) as { base_code: string; conversion_rates: Record<string, number> };
      cached = {
        base: data.base_code,
        rates: data.conversion_rates,
        lastUpdated: new Date().toISOString(),
        fetchedAt: Date.now(),
      };
      return cached;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  };
}
