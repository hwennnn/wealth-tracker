import { convertAmount } from "./currency";
import type { ExchangeRates } from "./types";

/**
 * Net worth rule:
 * - A statement's balance_owed is a positive liability (what is still owed).
 * - Only the latest statement on each card counts. Older statements are history,
 *   not extra debt, so they are never summed.
 * - "Latest" is the greatest statement_date, then created_at, then id.
 * - Current net worth uses that latest statement even when it falls after the
 *   last asset snapshot, because the statement is the balance owed today.
 * - A historical point on date D uses the latest statement with
 *   statement_date <= D, so a statement does not change net worth before it exists.
 * - Amounts are converted with the same USD-based rates as asset entries.
 */

export type DatedStatement = {
  id: string;
  credit_card_id: string;
  statement_date: string;
  balance_owed: number | string;
  currency: string;
  created_at?: string | null;
};

export type CardRef = {
  id: string;
  category_id: string;
};

export type AssetEntry = {
  category_id: string;
  amount: number | string;
  currency: string;
};

export function dateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? value;
}

export function parseDateKey(value: string): Date {
  const key = dateKey(value);
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function asAmount(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDisplay(
  amount: number,
  currency: string,
  displayCurrency: string,
  rates: ExchangeRates | null
): number {
  if (!currency || currency === displayCurrency || !rates) return amount;
  return convertAmount(amount, currency, displayCurrency, rates);
}

function compareStatements(a: DatedStatement, b: DatedStatement): number {
  const byDate = dateKey(a.statement_date).localeCompare(dateKey(b.statement_date));
  if (byDate !== 0) return byDate;
  const byCreated = (a.created_at ?? "").localeCompare(b.created_at ?? "");
  if (byCreated !== 0) return byCreated;
  return a.id.localeCompare(b.id);
}

/** Latest statement for one card. `asOf` (inclusive) drops statements after that date. */
export function latestStatement<T extends DatedStatement>(
  statements: T[],
  asOf?: string
): T | null {
  const cutoff = asOf ? dateKey(asOf) : null;
  let best: T | null = null;
  for (const statement of statements) {
    if (cutoff && dateKey(statement.statement_date) > cutoff) continue;
    if (!best || compareStatements(statement, best) > 0) best = statement;
  }
  return best;
}

export type OutstandingCard = {
  cardId: string;
  categoryId: string;
  statementId: string | null;
  statementDate: string | null;
  nativeAmount: number;
  currency: string;
  convertedAmount: number;
};

export type AccountPosition = {
  categoryId: string;
  assets: number;
  liabilities: number;
  net: number;
  cards: OutstandingCard[];
};

export type NetPosition = {
  assets: number;
  liabilities: number;
  net: number;
  accounts: AccountPosition[];
  cards: OutstandingCard[];
};

export function netPosition(input: {
  entries: AssetEntry[];
  cards: CardRef[];
  statements: DatedStatement[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
  /** Only statements on or before this date count. Omit for the current balance. */
  asOf?: string;
  /** Preferred account order. Accounts with neither assets nor cards are skipped. */
  categoryOrder?: string[];
}): NetPosition {
  const {
    entries,
    cards,
    statements,
    displayCurrency,
    exchangeRates,
    asOf,
    categoryOrder,
  } = input;

  const byCard = new Map<string, DatedStatement[]>();
  for (const statement of statements) {
    const list = byCard.get(statement.credit_card_id);
    if (list) list.push(statement);
    else byCard.set(statement.credit_card_id, [statement]);
  }

  const outstanding: OutstandingCard[] = cards.map((card) => {
    const latest = latestStatement(byCard.get(card.id) ?? [], asOf);
    const nativeAmount = latest ? asAmount(latest.balance_owed) : 0;
    const currency = latest?.currency || "";
    return {
      cardId: card.id,
      categoryId: card.category_id,
      statementId: latest?.id ?? null,
      statementDate: latest ? dateKey(latest.statement_date) : null,
      nativeAmount,
      currency,
      convertedAmount: latest
        ? toDisplay(nativeAmount, currency, displayCurrency, exchangeRates)
        : 0,
    };
  });

  const assetsByCategory = new Map<string, number>();
  let assets = 0;
  for (const entry of entries) {
    const converted = toDisplay(
      asAmount(entry.amount),
      entry.currency,
      displayCurrency,
      exchangeRates
    );
    assets += converted;
    assetsByCategory.set(
      entry.category_id,
      (assetsByCategory.get(entry.category_id) ?? 0) + converted
    );
  }

  const cardsByCategory = new Map<string, OutstandingCard[]>();
  let liabilities = 0;
  for (const card of outstanding) {
    liabilities += card.convertedAmount;
    const list = cardsByCategory.get(card.categoryId);
    if (list) list.push(card);
    else cardsByCategory.set(card.categoryId, [card]);
  }

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  const push = (id: string) => {
    if (seen.has(id)) return;
    if (!assetsByCategory.has(id) && !cardsByCategory.has(id)) return;
    seen.add(id);
    orderedIds.push(id);
  };
  for (const id of categoryOrder ?? []) push(id);
  for (const id of assetsByCategory.keys()) push(id);
  for (const id of cardsByCategory.keys()) push(id);

  const accounts: AccountPosition[] = orderedIds.map((categoryId) => {
    const accountAssets = assetsByCategory.get(categoryId) ?? 0;
    const accountCards = cardsByCategory.get(categoryId) ?? [];
    const accountLiabilities = accountCards.reduce(
      (sum, card) => sum + card.convertedAmount,
      0
    );
    return {
      categoryId,
      assets: accountAssets,
      liabilities: accountLiabilities,
      net: accountAssets - accountLiabilities,
      cards: accountCards,
    };
  });

  return {
    assets,
    liabilities,
    net: assets - liabilities,
    accounts,
    cards: outstanding,
  };
}
