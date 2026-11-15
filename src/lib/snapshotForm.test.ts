import { describe, expect, it } from "vitest";
import type { ExchangeRates } from "./types";
import { parseSnapshotStatements, snapshotPreview } from "./snapshotForm";

const rates: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, SGD: 1.35 },
  lastUpdated: "2026-11-14T00:00:00.000Z",
};

describe("parseSnapshotStatements", () => {
  it("skips blank balances and keeps a zero balance", () => {
    const parsed = parseSnapshotStatements([
      { cardId: "a", cardName: "Altitude", balance: "", currency: "SGD" },
      { cardId: "b", cardName: "Fresh", balance: "   ", currency: "SGD" },
      { cardId: "c", cardName: "365", balance: "0", currency: "SGD" },
      { cardId: "d", cardName: "Other", balance: "2450.30", currency: "SGD" },
    ]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statements).toEqual([
      { creditCardId: "c", balanceOwed: 0, currency: "SGD" },
      { creditCardId: "d", balanceOwed: 2450.3, currency: "SGD" },
    ]);
  });

  it("rejects a negative or non-numeric balance instead of dropping it", () => {
    const negative = parseSnapshotStatements([
      { cardId: "a", cardName: "Altitude", balance: "-5", currency: "SGD" },
    ]);
    expect(negative).toEqual({
      ok: false,
      error: "Altitude: statement balance must be zero or more, or left blank.",
    });

    const text = parseSnapshotStatements([
      { cardId: "a", cardName: "Altitude", balance: "abc", currency: "SGD" },
    ]);
    expect(text.ok).toBe(false);
  });
});

describe("snapshotPreview", () => {
  it("subtracts only the filled statement balances, converted", () => {
    const preview = snapshotPreview({
      assets: [
        { amount: 18400, currency: "SGD" },
        { amount: 1000, currency: "USD" },
      ],
      statements: [
        { creditCardId: "altitude", balanceOwed: 500, currency: "SGD" },
        { creditCardId: "usd-card", balanceOwed: 100, currency: "USD" },
      ],
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    // Assets 18400 + 1350. Cards 500 + 135.
    expect(preview.assets).toBeCloseTo(19750, 2);
    expect(preview.liabilities).toBeCloseTo(635, 2);
    expect(preview.net).toBeCloseTo(19115, 2);
  });
});
