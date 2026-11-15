import { describe, expect, it } from "vitest";
import type { ExchangeRates } from "./types";
import {
  assetAllocation,
  latestStatement,
  netPosition,
  seriesAtDates,
  todayKey,
  type DatedStatement,
} from "./netWorth";

const rates: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, SGD: 1.35, EUR: 0.92 },
  lastUpdated: "2026-11-14T00:00:00.000Z",
};

function statement(
  partial: Partial<DatedStatement> & Pick<DatedStatement, "id" | "statement_date" | "balance_owed">
): DatedStatement {
  return {
    credit_card_id: "card-1",
    currency: "SGD",
    created_at: "2026-11-01T00:00:00.000Z",
    ...partial,
  };
}

describe("latestStatement", () => {
  const older = statement({
    id: "s1",
    statement_date: "2026-09-12",
    balance_owed: 1800,
    created_at: "2026-09-12T00:00:00.000Z",
  });
  const newer = statement({
    id: "s2",
    statement_date: "2026-11-08",
    balance_owed: "2450.30",
    created_at: "2026-11-08T00:00:00.000Z",
  });

  it("uses the newest statement date and does not sum history", () => {
    const latest = latestStatement([older, newer]);
    expect(latest?.id).toBe("s2");
    expect(latest?.balance_owed).toBe("2450.30");
  });

  it("breaks a same-day tie with created_at, then id", () => {
    const early = statement({
      id: "a",
      statement_date: "2026-11-08",
      balance_owed: 100,
      created_at: "2026-11-08T01:00:00.000Z",
    });
    const late = statement({
      id: "b",
      statement_date: "2026-11-08",
      balance_owed: 50,
      created_at: "2026-11-08T09:00:00.000Z",
    });
    expect(latestStatement([early, late])?.id).toBe("b");

    const firstId = statement({
      id: "m",
      statement_date: "2026-11-08",
      balance_owed: 10,
      created_at: "2026-11-08T09:00:00.000Z",
    });
    const secondId = statement({
      id: "z",
      statement_date: "2026-11-08",
      balance_owed: 20,
      created_at: "2026-11-08T09:00:00.000Z",
    });
    expect(latestStatement([firstId, secondId])?.id).toBe("z");
  });

  it("includes a statement on the as-of date and ignores later ones", () => {
    expect(latestStatement([older, newer], "2026-11-08")?.id).toBe("s2");
    expect(latestStatement([older, newer], "2026-10-01")?.id).toBe("s1");
    expect(latestStatement([older, newer], "2026-09-11")).toBeNull();
  });
});

describe("netPosition", () => {
  const cards = [
    { id: "altitude", category_id: "dbs" },
    { id: "fresh", category_id: "dbs" },
    { id: "ocbc365", category_id: "ocbc" },
  ];
  const statements: DatedStatement[] = [
    statement({
      id: "alt-sep",
      credit_card_id: "altitude",
      statement_date: "2026-09-12",
      balance_owed: 1800,
      created_at: "2026-09-12T00:00:00.000Z",
    }),
    statement({
      id: "alt-nov",
      credit_card_id: "altitude",
      statement_date: "2026-11-08",
      balance_owed: 2450.3,
      created_at: "2026-11-08T00:00:00.000Z",
    }),
    statement({
      id: "fresh-nov",
      credit_card_id: "fresh",
      statement_date: "2026-11-05",
      balance_owed: 860,
      created_at: "2026-11-05T00:00:00.000Z",
    }),
    statement({
      id: "ocbc-nov",
      credit_card_id: "ocbc365",
      statement_date: "2026-11-09",
      balance_owed: 1000,
      currency: "USD",
      created_at: "2026-11-09T00:00:00.000Z",
    }),
  ];

  const entries = [
    { category_id: "dbs", amount: 18400, currency: "SGD" },
    { category_id: "ocbc", amount: 9200, currency: "SGD" },
    { category_id: "investments", amount: "45200.00", currency: "SGD" },
  ];

  it("subtracts the latest statement per card, converted into the display currency", () => {
    const position = netPosition({
      entries,
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryOrder: ["dbs", "ocbc", "investments"],
    });

    // USD 1000 -> SGD 1350. DBS cards 2450.30 + 860. September statement is not added again.
    expect(position.assets).toBeCloseTo(72800, 2);
    expect(position.liabilities).toBeCloseTo(2450.3 + 860 + 1350, 2);
    expect(position.net).toBeCloseTo(72800 - (2450.3 + 860 + 1350), 2);

    const dbs = position.accounts.find((account) => account.categoryId === "dbs");
    const ocbc = position.accounts.find((account) => account.categoryId === "ocbc");
    const investments = position.accounts.find(
      (account) => account.categoryId === "investments"
    );
    expect(dbs).toMatchObject({
      assets: 18400,
      net: 18400 - 2450.3 - 860,
    });
    expect(dbs?.liabilities).toBeCloseTo(3310.3, 2);
    expect(ocbc?.liabilities).toBeCloseTo(1350, 2);
    expect(ocbc?.net).toBeCloseTo(9200 - 1350, 2);
    expect(investments).toMatchObject({ assets: 45200, liabilities: 0, net: 45200 });
    expect(position.accounts.map((account) => account.categoryId)).toEqual([
      "dbs",
      "ocbc",
      "investments",
    ]);
  });

  it("ignores statements that did not exist yet on a historical snapshot", () => {
    const position = netPosition({
      entries: [{ category_id: "dbs", amount: 16200, currency: "SGD" }],
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
      asOf: "2026-09-15",
    });
    expect(position.liabilities).toBeCloseTo(1800, 2);
    expect(position.net).toBeCloseTo(14400, 2);
  });

  it("treats a zero balance as paid off", () => {
    const position = netPosition({
      entries: [{ category_id: "dbs", amount: 1000, currency: "SGD" }],
      cards: [{ id: "altitude", category_id: "dbs" }],
      statements: [
        statement({
          id: "paid",
          credit_card_id: "altitude",
          statement_date: "2026-11-08",
          balance_owed: 0,
        }),
      ],
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(position.liabilities).toBe(0);
    expect(position.net).toBe(1000);
  });

  it("counts a card with no assets as a negative net", () => {
    const position = netPosition({
      entries: [],
      cards: [{ id: "altitude", category_id: "dbs" }],
      statements: [
        statement({
          id: "only",
          credit_card_id: "altitude",
          statement_date: "2026-11-08",
          balance_owed: 400,
        }),
      ],
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(position.assets).toBe(0);
    expect(position.liabilities).toBe(400);
    expect(position.net).toBe(-400);
    expect(position.accounts[0].categoryId).toBe("dbs");
  });

  it("leaves a foreign amount unconverted when rates are missing, matching asset entries", () => {
    const position = netPosition({
      entries: [{ category_id: "dbs", amount: 100, currency: "SGD" }],
      cards: [{ id: "altitude", category_id: "dbs" }],
      statements: [
        statement({
          id: "usd",
          credit_card_id: "altitude",
          statement_date: "2026-11-08",
          balance_owed: 40,
          currency: "USD",
        }),
      ],
      displayCurrency: "SGD",
      exchangeRates: null,
    });
    expect(position.liabilities).toBe(40);
    expect(position.net).toBe(60);
  });
});

describe("seriesAtDates", () => {
  const cards = [
    { id: "altitude", category_id: "dbs" },
    { id: "fresh", category_id: "dbs" },
    { id: "ocbc365", category_id: "ocbc" },
  ];
  const statements: DatedStatement[] = [
    statement({
      id: "alt-sep",
      credit_card_id: "altitude",
      statement_date: "2026-09-12",
      balance_owed: 1800,
      created_at: "2026-09-12T00:00:00.000Z",
    }),
    statement({
      id: "alt-nov",
      credit_card_id: "altitude",
      statement_date: "2026-11-08",
      balance_owed: 2450.3,
      created_at: "2026-11-08T00:00:00.000Z",
    }),
    statement({
      id: "fresh-nov",
      credit_card_id: "fresh",
      statement_date: "2026-11-05",
      balance_owed: 860,
      created_at: "2026-11-05T00:00:00.000Z",
    }),
    statement({
      id: "ocbc-nov",
      credit_card_id: "ocbc365",
      statement_date: "2026-11-09",
      balance_owed: 1000,
      currency: "USD",
      created_at: "2026-11-09T00:00:00.000Z",
    }),
  ];
  const points = [
    {
      date: "2026-08-15T12:00:00.000Z",
      entries: [
        { category_id: "dbs", amount: 15000, currency: "SGD" },
        { category_id: "ocbc", amount: 8000, currency: "SGD" },
      ],
    },
    {
      date: "2026-09-15T12:00:00.000Z",
      entries: [
        { category_id: "dbs", amount: 16200, currency: "SGD" },
        { category_id: "ocbc", amount: 8400, currency: "SGD" },
      ],
    },
    {
      date: "2026-11-10T12:00:00.000Z",
      entries: [
        { category_id: "dbs", amount: 18400, currency: "SGD" },
        { category_id: "ocbc", amount: 9200, currency: "SGD" },
      ],
    },
  ];

  it("uses the statement outstanding on each date, not the sum of history", () => {
    const series = seriesAtDates({
      points,
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
    });
    expect(series.map((point) => point.date)).toEqual([
      "2026-08-15",
      "2026-09-15",
      "2026-11-10",
    ]);
    expect(series[0]).toMatchObject({ assets: 23000, liabilities: 0, net: 23000 });
    expect(series[1]).toMatchObject({ assets: 24600, liabilities: 1800, net: 22800 });
    expect(series[2].assets).toBe(27600);
    expect(series[2].liabilities).toBeCloseTo(2450.3 + 860 + 1350, 2);
    expect(series[2].net).toBeCloseTo(27600 - (2450.3 + 860 + 1350), 2);
  });

  it("keeps another account's cards out of an account series", () => {
    const series = seriesAtDates({
      points,
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryId: "dbs",
    });
    expect(series[0]).toMatchObject({ assets: 15000, liabilities: 0, net: 15000 });
    expect(series[1]).toMatchObject({ assets: 16200, liabilities: 1800, net: 14400 });
    expect(series[2].liabilities).toBeCloseTo(2450.3 + 860, 2);
    expect(series[2].net).toBeCloseTo(18400 - 2450.3 - 860, 2);

    const ocbc = seriesAtDates({
      points,
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryId: "ocbc",
    });
    expect(ocbc[1].liabilities).toBe(0);
    expect(ocbc[2].liabilities).toBeCloseTo(1350, 2);
    expect(ocbc[2].net).toBeCloseTo(9200 - 1350, 2);
  });

  it("still plots a card when that account has no asset entry on the date", () => {
    const series = seriesAtDates({
      points: [
        {
          date: "2026-11-10",
          entries: [{ category_id: "ocbc", amount: 100, currency: "SGD" }],
        },
      ],
      cards,
      statements,
      displayCurrency: "SGD",
      exchangeRates: rates,
      categoryId: "dbs",
    });
    expect(series[0].assets).toBe(0);
    expect(series[0].liabilities).toBeCloseTo(3310.3, 2);
    expect(series[0].net).toBeCloseTo(-3310.3, 2);
  });
});

describe("assetAllocation", () => {
  it("splits assets by account and reports liabilities beside the slices", () => {
    const allocation = assetAllocation({
      entries: [
        { category_id: "dbs", amount: 18400, currency: "SGD" },
        { category_id: "dbs", amount: 100, currency: "SGD" },
        { category_id: "ocbc", amount: 9200, currency: "SGD" },
      ],
      cards: [
        { id: "altitude", category_id: "dbs" },
        { id: "ocbc365", category_id: "ocbc" },
      ],
      statements: [
        statement({
          id: "now",
          credit_card_id: "altitude",
          statement_date: "2026-11-08",
          balance_owed: 500,
        }),
        statement({
          id: "later",
          credit_card_id: "ocbc365",
          statement_date: "2026-12-01",
          balance_owed: 9999,
          currency: "USD",
        }),
      ],
      displayCurrency: "SGD",
      exchangeRates: rates,
      asOf: "2026-11-14",
    });

    expect(allocation.slices).toEqual([
      { categoryId: "dbs", value: 18500 },
      { categoryId: "ocbc", value: 9200 },
    ]);
    expect(allocation.assets).toBe(27700);
    expect(allocation.liabilities).toBe(500);
    expect(allocation.net).toBe(27200);
    expect(allocation.slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(
      allocation.assets
    );
  });
});

describe("todayKey", () => {
  it("uses the local calendar date", () => {
    expect(todayKey(new Date(2026, 10, 14))).toBe("2026-11-14");
  });
});
