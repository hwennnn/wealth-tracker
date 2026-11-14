import type {
  Category,
  CreditCard,
  CreditCardStatement,
  Entry,
  ExchangeRates,
  TimelineEntry,
} from "@/lib/types";

const userId = "demo-user";

export const demoRates: ExchangeRates = {
  base: "USD",
  rates: { USD: 1, SGD: 1.35, EUR: 0.92, GBP: 0.78 },
  lastUpdated: "2026-11-14T00:00:00.000Z",
};

export const demoCategories: Category[] = [
  {
    id: "dbs",
    name: "DBS Savings",
    description: "DBS Multiplier",
    created_at: "2026-01-01T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "ocbc",
    name: "OCBC 360",
    description: "OCBC savings",
    created_at: "2026-01-01T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "investments",
    name: "Investments",
    description: "Brokerage account",
    created_at: "2026-01-01T00:00:00.000Z",
    user_id: userId,
  },
  {
    id: "cpf",
    name: "CPF",
    description: "Retirement balances",
    created_at: "2026-01-01T00:00:00.000Z",
    user_id: userId,
  },
];

export const demoCards: CreditCard[] = [
  {
    id: "altitude",
    category_id: "dbs",
    name: "DBS Altitude",
    currency: "SGD",
    notes: "Visa",
    user_id: userId,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fresh",
    category_id: "dbs",
    name: "DBS Live Fresh",
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ocbc365",
    category_id: "ocbc",
    name: "OCBC 365",
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export const demoStatements: CreditCardStatement[] = [
  {
    id: "alt-sep",
    credit_card_id: "altitude",
    statement_date: "2026-09-12",
    period_start: "2026-08-13",
    balance_owed: 1800,
    due_date: "2026-10-03",
    minimum_payment: 90,
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "alt-nov",
    credit_card_id: "altitude",
    statement_date: "2026-11-08",
    period_start: "2026-10-09",
    balance_owed: 2450.3,
    due_date: "2026-12-03",
    minimum_payment: 120,
    currency: "SGD",
    notes: "Travel month",
    user_id: userId,
    created_at: "2026-11-08T00:00:00.000Z",
  },
  {
    id: "fresh-nov",
    credit_card_id: "fresh",
    statement_date: "2026-11-05",
    period_start: "2026-10-06",
    balance_owed: 860,
    due_date: "2026-11-28",
    minimum_payment: 50,
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-11-05T00:00:00.000Z",
  },
  {
    id: "ocbc-oct",
    credit_card_id: "ocbc365",
    statement_date: "2026-10-20",
    period_start: "2026-09-21",
    balance_owed: 980,
    due_date: "2026-11-14",
    minimum_payment: 50,
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "ocbc-nov",
    credit_card_id: "ocbc365",
    statement_date: "2026-11-09",
    period_start: "2026-10-10",
    balance_owed: 1310.55,
    due_date: "2026-12-04",
    minimum_payment: 65,
    currency: "SGD",
    notes: null,
    user_id: userId,
    created_at: "2026-11-09T00:00:00.000Z",
  },
];

const snapshots: { date: string; amounts: Record<string, number> }[] = [
  {
    date: "2026-08-15T12:00:00.000Z",
    amounts: { dbs: 15000, ocbc: 8000, investments: 40000, cpf: 58000 },
  },
  {
    date: "2026-09-15T12:00:00.000Z",
    amounts: { dbs: 16200, ocbc: 8400, investments: 42100, cpf: 59000 },
  },
  {
    date: "2026-10-15T12:00:00.000Z",
    amounts: { dbs: 17100, ocbc: 8800, investments: 43800, cpf: 60000 },
  },
  {
    date: "2026-11-10T12:00:00.000Z",
    amounts: { dbs: 18400, ocbc: 9200, investments: 45200, cpf: 61000 },
  },
];

function entriesFor(date: string, amounts: Record<string, number>): Entry[] {
  return Object.entries(amounts).map(([categoryId, amount]) => ({
    id: `${categoryId}-${date.slice(0, 10)}`,
    category_id: categoryId,
    amount,
    currency: "SGD",
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

export const demoLatestEntries: Entry[] =
  demoTimeline[demoTimeline.length - 1].entries;
