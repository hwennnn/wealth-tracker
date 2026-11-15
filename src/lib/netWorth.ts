import { convertAmount } from "./money";
import type { ExchangeRates } from "./types";

/**
 * A credit card is a category with kind "credit_card".
 * Its entries are normal snapshot rows. The amount is the balance owed, stored
 * as a positive number. Net worth on a snapshot is the asset rows minus the
 * credit-card rows on that same snapshot. Nothing carries forward on its own.
 */

export type CategoryKind = "asset" | "credit_card";

export type CategoryRef = {
  id: string;
  kind?: CategoryKind | string | null;
  parent_id?: string | null;
};

export type SnapshotEntry = {
  category_id: string;
  amount: number | string;
  currency: string;
};

export function isCreditCard(category?: { kind?: string | null } | null): boolean {
  return category?.kind === "credit_card";
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

/** Assets keep their current order. Each card is placed directly after its bank. */
export function orderCategories<T extends CategoryRef>(categories: T[]): T[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const cardsByParent = new Map<string, T[]>();
  const unlinked: T[] = [];
  const assets: T[] = [];

  for (const category of categories) {
    if (!isCreditCard(category)) {
      assets.push(category);
      continue;
    }
    const parent = category.parent_id ? byId.get(category.parent_id) : undefined;
    if (parent && !isCreditCard(parent)) {
      const list = cardsByParent.get(parent.id) ?? [];
      list.push(category);
      cardsByParent.set(parent.id, list);
    } else {
      unlinked.push(category);
    }
  }

  const ordered: T[] = [];
  for (const asset of assets) {
    ordered.push(asset);
    for (const card of cardsByParent.get(asset.id) ?? []) ordered.push(card);
  }
  return [...ordered, ...unlinked];
}

export type LinkedCard = {
  categoryId: string;
  amount: number;
};

export type AccountPosition = {
  categoryId: string;
  assets: number;
  liabilities: number;
  net: number;
  cards: LinkedCard[];
};

export type NetPosition = {
  assets: number;
  liabilities: number;
  net: number;
  accounts: AccountPosition[];
};

export function netPosition(input: {
  entries: SnapshotEntry[];
  categories: CategoryRef[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
}): NetPosition {
  const { entries, categories, displayCurrency, exchangeRates } = input;
  const byId = new Map(categories.map((category) => [category.id, category]));
  const assetsByCategory = new Map<string, number>();
  const cardsByParent = new Map<string, LinkedCard[]>();
  const unlinked = new Map<string, number>();
  let assets = 0;
  let liabilities = 0;

  for (const entry of entries) {
    const converted = toDisplay(
      asAmount(entry.amount),
      entry.currency,
      displayCurrency,
      exchangeRates
    );
    const category = byId.get(entry.category_id);
    if (isCreditCard(category)) {
      liabilities += converted;
      const parentId = category?.parent_id;
      const parent = parentId ? byId.get(parentId) : undefined;
      if (parent && !isCreditCard(parent)) {
        const list = cardsByParent.get(parent.id) ?? [];
        const existing = list.find((card) => card.categoryId === entry.category_id);
        if (existing) existing.amount += converted;
        else list.push({ categoryId: entry.category_id, amount: converted });
        cardsByParent.set(parent.id, list);
      } else {
        unlinked.set(entry.category_id, (unlinked.get(entry.category_id) ?? 0) + converted);
      }
    } else {
      assets += converted;
      assetsByCategory.set(
        entry.category_id,
        (assetsByCategory.get(entry.category_id) ?? 0) + converted
      );
    }
  }

  const accounts: AccountPosition[] = [];
  for (const category of orderCategories(categories)) {
    if (isCreditCard(category)) {
      const amount = unlinked.get(category.id);
      if (!amount) continue;
      accounts.push({
        categoryId: category.id,
        assets: 0,
        liabilities: amount,
        net: -amount,
        cards: [],
      });
      continue;
    }
    const accountAssets = assetsByCategory.get(category.id) ?? 0;
    const cards = cardsByParent.get(category.id) ?? [];
    const accountLiabilities = cards.reduce((sum, card) => sum + card.amount, 0);
    if (accountAssets === 0 && accountLiabilities === 0) continue;
    accounts.push({
      categoryId: category.id,
      assets: accountAssets,
      liabilities: accountLiabilities,
      net: accountAssets - accountLiabilities,
      cards,
    });
  }

  return { assets, liabilities, net: assets - liabilities, accounts };
}

export type SeriesPoint = {
  date: string;
  assets: number;
  liabilities: number;
  net: number;
};

function dateKey(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (match) return match[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Each point is that snapshot's own rows. A card balance does not leak into other dates. */
export function seriesAtDates(input: {
  points: { date: string; entries: SnapshotEntry[] }[];
  categories: CategoryRef[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
  categoryId?: string;
}): SeriesPoint[] {
  return input.points.map((point) => {
    const position = netPosition({
      entries: point.entries,
      categories: input.categories,
      displayCurrency: input.displayCurrency,
      exchangeRates: input.exchangeRates,
    });
    if (input.categoryId) {
      const account = position.accounts.find((item) => item.categoryId === input.categoryId);
      return {
        date: dateKey(point.date),
        assets: account?.assets ?? 0,
        liabilities: account?.liabilities ?? 0,
        net: account?.net ?? 0,
      };
    }
    return {
      date: dateKey(point.date),
      assets: position.assets,
      liabilities: position.liabilities,
      net: position.net,
    };
  });
}

export function assetAllocation(input: {
  entries: SnapshotEntry[];
  categories: CategoryRef[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
}): {
  slices: { categoryId: string; value: number }[];
  assets: number;
  liabilities: number;
  net: number;
} {
  const position = netPosition(input);
  const slices = position.accounts
    .filter((account) => account.assets > 0)
    .map((account) => ({
      categoryId: account.categoryId,
      value: Math.round(account.assets * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
  return {
    slices,
    assets: position.assets,
    liabilities: position.liabilities,
    net: position.net,
  };
}
