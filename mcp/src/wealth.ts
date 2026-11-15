// Pure views over the user's data. Every number here is computed the same way the
// dashboard computes it, by reusing the web app's own modules.
import { convertAmount } from "../../src/lib/money";
import { isCreditCard, netPosition, orderCategories, seriesAtDates } from "../../src/lib/netWorth";
import { compareRegions, defaultCurrencyFor, regionFor } from "../../src/lib/regions";
import type { Category, Entry, ExchangeRates } from "../../src/lib/types";

const round = (n: number) => Math.round(n * 100) / 100;

export type Snapshot = { date: string; entries: Entry[] };

/** Entries grouped by date, newest first. One date = one snapshot, as in the app. */
export function snapshots(entries: Entry[]): Snapshot[] {
  const byDate = new Map<string, Entry[]>();
  for (const entry of entries) {
    const date = String(entry.date).slice(0, 10);
    const list = byDate.get(date) ?? [];
    list.push(entry);
    byDate.set(date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({ date, entries: list }));
}

function convert(amount: number, from: string, to: string, rates: ExchangeRates | null) {
  if (!rates || from === to) return amount;
  return convertAmount(amount, from, to, rates);
}

export function describeAccount(category: Category, categories: Category[]) {
  const bank =
    isCreditCard(category) && category.parent_id
      ? categories.find((item) => item.id === category.parent_id && !isCreditCard(item))
      : undefined;
  const currency = defaultCurrencyFor(category, categories);
  return {
    id: category.id,
    name: category.name,
    kind: isCreditCard(category) ? "credit_card" : "asset",
    currency,
    currency_is_explicit: Boolean(category.currency),
    region: regionFor(currency).label,
    bank: bank ? { id: bank.id, name: bank.name } : null,
    description: category.description ?? null,
  };
}

export function listAccounts(categories: Category[]) {
  return orderCategories(categories).map((category) => describeAccount(category, categories));
}

function totals(entries: Entry[], categories: Category[], currency: string, rates: ExchangeRates | null) {
  const position = netPosition({ entries, categories, displayCurrency: currency, exchangeRates: rates });
  return {
    net_worth: round(position.net),
    assets: round(position.assets),
    credit_card_debt: round(position.liabilities),
  };
}

/** Rows of one snapshot, grouped by the currency they were recorded in (the dashboard's regions). */
export function regionBreakdown(
  entries: Entry[],
  categories: Category[],
  currency: string,
  rates: ExchangeRates | null
) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const order = new Map(orderCategories(categories).map((category, index) => [category.id, index]));
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.currency) ?? [];
    list.push(entry);
    groups.set(entry.currency, list);
  }
  const all = [...groups.entries()].sort(([a], [b]) => compareRegions(a, b));
  const positiveTotal = all.reduce((sum, [code, list]) => {
    const value = list.reduce((s, e) => {
      const sign = isCreditCard(byId.get(e.category_id)) ? -1 : 1;
      return s + sign * convert(Number(e.amount), code, currency, rates);
    }, 0);
    return sum + Math.max(0, value);
  }, 0);

  return all.map(([code, list]) => {
    let native = 0;
    let converted = 0;
    const rows = list
      .slice()
      .sort((a, b) => (order.get(a.category_id) ?? 999) - (order.get(b.category_id) ?? 999))
      .map((entry) => {
        const category = byId.get(entry.category_id);
        const card = isCreditCard(category);
        const sign = card ? -1 : 1;
        const amount = Number(entry.amount);
        const inDisplay = convert(amount, code, currency, rates);
        native += sign * amount;
        converted += sign * inDisplay;
        const bank =
          card && category?.parent_id ? byId.get(category.parent_id)?.name ?? null : null;
        return {
          entry_id: entry.id,
          account_id: entry.category_id,
          account: category?.name ?? "Unknown account",
          kind: card ? "credit_card" : "asset",
          bank,
          amount_recorded: round(amount),
          signed_amount: round(sign * amount),
          [`signed_amount_${currency.toLowerCase()}`]: round(sign * inDisplay),
          notes: entry.notes ?? null,
        };
      });
    return {
      currency: code,
      region: regionFor(code).label,
      net_in_region_currency: round(native),
      [`net_in_${currency.toLowerCase()}`]: round(converted),
      share_of_positive_net_pct: positiveTotal > 0 && converted > 0 ? round((converted / positiveTotal) * 100) : 0,
      rows,
    };
  });
}

export function dashboard(
  categories: Category[],
  entries: Entry[],
  currency: string,
  rates: ExchangeRates | null
) {
  const all = snapshots(entries);
  const latest = all[0];
  const previous = all[1];
  if (!latest) {
    return {
      display_currency: currency,
      latest_snapshot: null,
      message: "No snapshots recorded yet. Use record_snapshot to add one.",
      accounts: listAccounts(categories),
    };
  }
  const now = totals(latest.entries, categories, currency, rates);
  const before = previous ? totals(previous.entries, categories, currency, rates) : null;
  const change = before ? round(now.net_worth - before.net_worth) : null;
  return {
    display_currency: currency,
    latest_snapshot: latest.date,
    previous_snapshot: previous?.date ?? null,
    ...now,
    change_vs_previous: change,
    change_vs_previous_pct:
      before && before.net_worth !== 0 ? round(((now.net_worth - before.net_worth) / before.net_worth) * 100) : null,
    regions: regionBreakdown(latest.entries, categories, currency, rates),
    accounts_without_a_row_in_latest_snapshot: categories
      .filter((category) => !latest.entries.some((entry) => entry.category_id === category.id))
      .map((category) => category.name),
    exchange_rates_as_of: rates?.lastUpdated ?? null,
    notes:
      "Amounts are as recorded in each row's currency; *_" +
      currency.toLowerCase() +
      " fields are converted at current rates. Credit card amounts are balances owed and subtract from net worth.",
  };
}

export function snapshotList(
  categories: Category[],
  entries: Entry[],
  currency: string,
  rates: ExchangeRates | null,
  limit: number
) {
  return snapshots(entries)
    .slice(0, limit)
    .map((snapshot) => ({
      date: snapshot.date,
      rows: snapshot.entries.length,
      ...totals(snapshot.entries, categories, currency, rates),
    }));
}

export function history(
  categories: Category[],
  entries: Entry[],
  currency: string,
  rates: ExchangeRates | null,
  options: { accountId?: string; from?: string; to?: string }
) {
  const points = snapshots(entries)
    .reverse()
    .filter((s) => (!options.from || s.date >= options.from) && (!options.to || s.date <= options.to));
  return seriesAtDates({
    points,
    categories,
    displayCurrency: currency,
    exchangeRates: rates,
    categoryId: options.accountId,
  }).map((point) => ({
    date: point.date,
    net: round(point.net),
    assets: round(point.assets),
    credit_card_debt: round(point.liabilities),
  }));
}

/** Finds an account by id or by name (case-insensitive). Throws with the closest names otherwise. */
export function resolveAccount(categories: Category[], ref: string): Category {
  const byId = categories.find((category) => category.id === ref);
  if (byId) return byId;
  const needle = ref.trim().toLowerCase();
  const exact = categories.filter((category) => category.name.trim().toLowerCase() === needle);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(`"${ref}" matches ${exact.length} accounts; pass the account id instead (see list_accounts).`);
  }
  const partial = categories.filter((category) => category.name.toLowerCase().includes(needle));
  if (partial.length === 1) return partial[0];
  const names = (partial.length ? partial : categories).map((category) => category.name).join(", ");
  throw new Error(`No account named "${ref}". Known accounts: ${names}.`);
}
