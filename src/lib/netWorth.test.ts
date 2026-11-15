import { describe, expect, it } from "vitest";
import type { ExchangeRates } from "./types";
import {
  assetAllocation,
  netPosition,
  orderCategories,
  seriesAtDates,
  type CategoryRef,
} from "./netWorth";

const rates: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, SGD: 1.35 },
  lastUpdated: "2026-11-15T00:00:00.000Z",
};

const categories: CategoryRef[] = [
  { id: "dbs", kind: "asset" },
  { id: "altitude", kind: "credit_card", parent_id: "dbs" },
  { id: "fresh", kind: "credit_card", parent_id: "dbs" },
  { id: "ocbc", kind: "asset" },
  { id: "ocbc365", kind: "credit_card", parent_id: "ocbc" },
  { id: "investments", kind: "asset" },
  { id: "loose", kind: "credit_card", parent_id: null },
];

describe("orderCategories", () => {
  it("places each card immediately after its bank and leaves unlinked cards last", () => {
    const shuffled: CategoryRef[] = [
      { id: "fresh", kind: "credit_card", parent_id: "dbs" },
      { id: "investments", kind: "asset" },
      { id: "dbs", kind: "asset" },
      { id: "loose", kind: "credit_card" },
      { id: "ocbc365", kind: "credit_card", parent_id: "ocbc" },
      { id: "altitude", kind: "credit_card", parent_id: "dbs" },
      { id: "ocbc", kind: "asset" },
    ];
    expect(orderCategories(shuffled).map((category) => category.id)).toEqual([
      "investments",
      "dbs",
      "fresh",
      "altitude",
      "ocbc",
      "ocbc365",
      "loose",
    ]);
  });
});

describe("netPosition", () => {
  it("subtracts credit-card rows on the snapshot and folds linked cards into the bank", () => {
    const position = netPosition({
      entries: [
        { category_id: "dbs", amount: 18400, currency: "SGD" },
        { category_id: "altitude", amount: 2450.3, currency: "SGD" },
        { category_id: "fresh", amount: "860", currency: "SGD" },
        { category_id: "ocbc", amount: 1000, currency: "USD" },
        { category_id: "ocbc365", amount: 100, currency: "USD" },
        { category_id: "investments", amount: 45200, currency: "SGD" },
        { category_id: "loose", amount: 50, currency: "SGD" },
      ],
      categories,
      displayCurrency: "SGD",
      exchangeRates: rates,
    });

    expect(position.assets).toBeCloseTo(18400 + 1350 + 45200, 2);
    expect(position.liabilities).toBeCloseTo(2450.3 + 860 + 135 + 50, 2);
    expect(position.net).toBeCloseTo(position.assets - position.liabilities, 2);

    const dbs = position.accounts.find((account) => account.categoryId === "dbs");
    expect(dbs?.assets).toBe(18400);
    expect(dbs?.liabilities).toBeCloseTo(3310.3, 2);
    expect(dbs?.net).toBeCloseTo(15089.7, 2);
    expect(dbs?.cards.map((card) => card.categoryId)).toEqual(["altitude", "fresh"]);

    const ocbc = position.accounts.find((account) => account.categoryId === "ocbc");
    expect(ocbc?.liabilities).toBeCloseTo(135, 2);
    expect(ocbc?.net).toBeCloseTo(1350 - 135, 2);

    const loose = position.accounts.find((account) => account.categoryId === "loose");
    expect(loose).toMatchObject({ assets: 0, liabilities: 50, net: -50, cards: [] });
  });

  it("does not treat a missing kind as a liability", () => {
    const position = netPosition({
      entries: [{ category_id: "cash", amount: 20, currency: "SGD" }],
      categories: [{ id: "cash" }],
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(position).toMatchObject({ assets: 20, liabilities: 0, net: 20 });
  });
});

describe("seriesAtDates", () => {
  it("uses only the rows on that snapshot", () => {
    const points = [
      {
        date: "2026-09-15T12:00:00.000Z",
        entries: [
          { category_id: "dbs", amount: 16200, currency: "SGD" },
          { category_id: "altitude", amount: 1800, currency: "SGD" },
        ],
      },
      {
        date: "2026-11-10",
        entries: [
          { category_id: "dbs", amount: 18400, currency: "SGD" },
          { category_id: "altitude", amount: 2450.3, currency: "SGD" },
          { category_id: "fresh", amount: 860, currency: "SGD" },
        ],
      },
    ];
    const series = seriesAtDates({
      points,
      categories,
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(series[0]).toMatchObject({ assets: 16200, liabilities: 1800, net: 14400 });
    expect(series[1].liabilities).toBeCloseTo(3310.3, 2);
    expect(series[1].net).toBeCloseTo(15089.7, 2);

    const dbs = seriesAtDates({
      points,
      categories,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryId: "dbs",
    });
    expect(dbs[0].net).toBe(14400);
    expect(dbs[1].liabilities).toBeCloseTo(3310.3, 2);

    const ocbc = seriesAtDates({
      points,
      categories,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryId: "ocbc",
    });
    expect(ocbc[1]).toMatchObject({ assets: 0, liabilities: 0, net: 0 });
  });
});

describe("assetAllocation", () => {
  it("slices assets only and reports card balances beside them", () => {
    const allocation = assetAllocation({
      entries: [
        { category_id: "dbs", amount: 100, currency: "SGD" },
        { category_id: "dbs", amount: 50, currency: "SGD" },
        { category_id: "investments", amount: 200, currency: "SGD" },
        { category_id: "altitude", amount: 40, currency: "SGD" },
      ],
      categories,
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(allocation.slices).toEqual([
      { categoryId: "investments", value: 200 },
      { categoryId: "dbs", value: 150 },
    ]);
    expect(allocation.assets).toBe(350);
    expect(allocation.liabilities).toBe(40);
    expect(allocation.net).toBe(310);
  });
});
