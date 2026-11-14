export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
};

export type BaseEntry = {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  user_id: string;
};

export type Entry = BaseEntry;

export type TimelineEntry = {
  id: string;
  date: string;
  entries: BaseEntry[];
  total_amount: number;
  currency: string;
  user_id: string;
};

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
};

export type BulkEntryRow = {
  id: string;
  categoryId: string;
  amount: string;
  currencyCode: string;
  notes: string;
};

/** A credit card attached to one account (category). */
export type CreditCard = {
  id: string;
  category_id: string;
  name: string;
  currency: string;
  notes?: string | null;
  user_id: string;
  created_at: string;
};

export type CreditCardInput = {
  category_id: string;
  name: string;
  currency: string;
  notes?: string | null;
};

/** One statement. balance_owed is a positive amount still owed. */
export type CreditCardStatement = {
  id: string;
  credit_card_id: string;
  statement_date: string;
  period_start?: string | null;
  balance_owed: number;
  due_date?: string | null;
  minimum_payment?: number | null;
  currency: string;
  notes?: string | null;
  user_id: string;
  created_at: string;
};

export type StatementInput = {
  credit_card_id: string;
  statement_date: string;
  period_start?: string | null;
  balance_owed: number;
  due_date?: string | null;
  minimum_payment?: number | null;
  currency: string;
  notes?: string | null;
};
