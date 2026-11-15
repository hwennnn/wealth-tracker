import type { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";

const userId = "demo-user";

export const demoRates: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, SGD: 1.35, EUR: 0.92, GBP: 0.78 },
  lastUpdated: "2026-11-15T00:00:00.000Z",
};

export const demoCategories: Category[] = [
  {
    id: "dbs",
    name: "DBS",
    description: "DBS Multiplier",
    kind: "asset",
    currency: "SGD",
    parent_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "altitude",
    name: "DBS Altitude",
    description: null,
    kind: "credit_card",
    currency: "SGD",
    parent_id: "dbs",
    created_at: "2026-01-02T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "fresh",
    name: "DBS Live Fresh",
    description: null,
    kind: "credit_card",
    currency: "SGD",
    parent_id: "dbs",
    created_at: "2026-01-03T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "ocbc",
    name: "OCBC",
    description: "OCBC 360",
    kind: "asset",
    currency: "SGD",
    parent_id: null,
    created_at: "2026-01-04T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "ocbc365",
    name: "OCBC 365",
    description: null,
    kind: "credit_card",
    currency: "SGD",
    parent_id: "ocbc",
    created_at: "2026-01-05T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "investments",
    name: "Investments",
    description: "Brokerage account",
    kind: "asset",
    currency: "USD",
    parent_id: null,
    created_at: "2026-01-06T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "cpf",
    name: "CPF",
    description: "Retirement balances",
    kind: "asset",
    currency: "SGD",
    parent_id: null,
    created_at: "2026-01-07T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "chase",
    name: "Chase",
    description: "Checking",
    kind: "asset",
    currency: "USD",
    parent_id: null,
    created_at: "2026-01-08T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "sapphire",
    name: "Sapphire Preferred",
    description: null,
    kind: "credit_card",
    currency: "USD",
    parent_id: "chase",
    created_at: "2026-01-09T00:00:00.000Z",
    user_id: userId,
  },
];

const currencyById = new Map(demoCategories.map((category) => [category.id, category.currency ?? "SGD"]));

const snapshots: { date: string; amounts: Record<string, number> }[] = [
  {
    date: "2026-08-15T12:00:00.000Z",
    amounts: { dbs: 15000, ocbc: 8000, investments: 29600, cpf: 58000 },
  },
  {
    date: "2026-09-15T12:00:00.000Z",
    amounts: { dbs: 16200, altitude: 1800, ocbc: 8400, investments: 31200, cpf: 59000 },
  },
  {
    date: "2026-10-15T12:00:00.000Z",
    amounts: { dbs: 17100, altitude: 2100, ocbc: 8800, ocbc365: 980, investments: 32400, cpf: 60000 },
  },
  {
    date: "2026-11-10T12:00:00.000Z",
    amounts: {
      dbs: 18400,
      altitude: 2450.3,
      fresh: 860,
      ocbc: 9200,
      ocbc365: 1310.55,
      investments: 33500,
      cpf: 61000,
      chase: 8200,
      sapphire: 1120.4,
    },
  },
];

function entriesFor(date: string, amounts: Record<string, number>): Entry[] {
  return Object.entries(amounts).map(([categoryId, amount]) => ({
    id: `${categoryId}-${date.slice(0, 10)}`,
    category_id: categoryId,
    amount,
    currency: currencyById.get(categoryId) ?? "SGD",
    date,
    user_id: userId,
  }));
}

export const demoTimeline: TimelineEntry[] = snapshots.map((snapshot) => {
  const entries = entriesFor(snapshot.date, snapshot.amounts);
  return {
    id: `timeline-${snapshot.date.slice(0, 10)}`,
    date: snapshot.date,
    entries,
    total_amount: entries.reduce((sum, entry) => sum + entry.amount, 0),
    currency: "SGD",
    user_id: userId,
  };
});

export const demoLatestEntries: Entry[] = demoTimeline[demoTimeline.length - 1].entries;
