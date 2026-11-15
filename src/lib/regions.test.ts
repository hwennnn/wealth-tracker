import { describe, expect, it } from "vitest";
import { formatCurrency } from "./currency";
import { compareRegions, defaultCurrencyFor, regionFor } from "./regions";

const bank = { id: "chase", currency: "USD", kind: "asset" as const, parent_id: null };
const card = { id: "venture", currency: null, kind: "credit_card" as const, parent_id: "chase" };
const loose = { id: "cash", currency: null, kind: "asset" as const, parent_id: null };

describe("defaultCurrencyFor", () => {
  it("uses the account's own currency", () => {
    expect(defaultCurrencyFor(bank, [bank])).toBe("USD");
  });

  it("lets a card without a currency inherit its bank's", () => {
    expect(defaultCurrencyFor(card, [bank, card])).toBe("USD");
  });

  it("falls back to SGD", () => {
    expect(defaultCurrencyFor(loose, [loose])).toBe("SGD");
    expect(defaultCurrencyFor(undefined, [])).toBe("SGD");
  });
});

describe("regions", () => {
  it("orders SGD before USD before unknown codes", () => {
    expect(["XYZ", "USD", "SGD"].sort(compareRegions)).toEqual(["SGD", "USD", "XYZ"]);
  });

  it("labels known and unknown currencies", () => {
    expect(regionFor("USD").label).toBe("United States");
    expect(regionFor("XYZ").label).toBe("XYZ");
  });
});

describe("formatCurrency", () => {
  it("never prints a bare $", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("US$1,234.50");
    expect(formatCurrency(1234.5, "SGD")).toBe("S$1,234.50");
  });

  it("puts the sign before the symbol", () => {
    expect(formatCurrency(-146.84, "SGD")).toBe("-S$146.84");
  });

  it("compacts large values", () => {
    expect(formatCurrency(33647, "USD", true)).toBe("US$33.6K");
    expect(formatCurrency(950, "USD", true)).toBe("US$950");
  });
});
