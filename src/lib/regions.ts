import { isCreditCard } from "./netWorth";
import type { Category } from "./types";

/**
 * Each account has a home currency (categories.currency). The region shown in the
 * UI is derived from that currency, so there is one field to keep right, not two.
 */

export type Region = {
  currency: string;
  flag: string;
  label: string;
  /** Tailwind classes for the small currency chip. */
  chip: string;
  /** Tailwind class for a solid swatch (bars, dots). */
  swatch: string;
};

const REGIONS: Record<string, Omit<Region, "currency">> = {
  SGD: {
    flag: "🇸🇬",
    label: "Singapore",
    chip: "bg-amber-500/15 text-amber-800 ring-amber-500/40 dark:text-amber-300",
    swatch: "bg-amber-500",
  },
  USD: {
    flag: "🇺🇸",
    label: "United States",
    chip: "bg-sky-500/15 text-sky-800 ring-sky-500/40 dark:text-sky-300",
    swatch: "bg-sky-500",
  },
  EUR: {
    flag: "🇪🇺",
    label: "Europe",
    chip: "bg-indigo-500/15 text-indigo-700 ring-indigo-500/30 dark:text-indigo-300",
    swatch: "bg-indigo-500",
  },
  GBP: {
    flag: "🇬🇧",
    label: "United Kingdom",
    chip: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
    swatch: "bg-violet-500",
  },
  JPY: {
    flag: "🇯🇵",
    label: "Japan",
    chip: "bg-pink-500/15 text-pink-700 ring-pink-500/30 dark:text-pink-300",
    swatch: "bg-pink-500",
  },
  AUD: {
    flag: "🇦🇺",
    label: "Australia",
    chip: "bg-lime-500/15 text-lime-800 ring-lime-500/40 dark:text-lime-300",
    swatch: "bg-lime-500",
  },
  CAD: {
    flag: "🇨🇦",
    label: "Canada",
    chip: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
    swatch: "bg-red-500",
  },
  CNY: {
    flag: "🇨🇳",
    label: "China",
    chip: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
    swatch: "bg-orange-500",
  },
  HKD: {
    flag: "🇭🇰",
    label: "Hong Kong",
    chip: "bg-teal-500/15 text-teal-700 ring-teal-500/30 dark:text-teal-300",
    swatch: "bg-teal-500",
  },
};

const ORDER = Object.keys(REGIONS);

export const FALLBACK_CURRENCY = "SGD";

export function regionFor(currency: string | null | undefined): Region {
  const code = (currency || FALLBACK_CURRENCY).toUpperCase();
  const known = REGIONS[code];
  if (known) return { currency: code, ...known };
  return {
    currency: code,
    flag: "🌐",
    label: code,
    chip: "bg-muted text-foreground ring-border",
    swatch: "bg-muted-foreground",
  };
}

/** Sort key so regions always appear in the same order (SGD, USD, …, then unknown A–Z). */
export function regionRank(currency: string): number {
  const index = ORDER.indexOf(currency);
  return index === -1 ? ORDER.length : index;
}

export function compareRegions(a: string, b: string): number {
  return regionRank(a) - regionRank(b) || a.localeCompare(b);
}

/**
 * The currency a new snapshot row for this account starts with.
 * A card without its own currency uses its bank's.
 */
export function defaultCurrencyFor(
  category: Pick<Category, "currency" | "kind" | "parent_id"> | undefined,
  categories: Pick<Category, "id" | "currency" | "kind">[]
): string {
  if (!category) return FALLBACK_CURRENCY;
  if (category.currency) return category.currency;
  if (isCreditCard(category) && category.parent_id) {
    const parent = categories.find((item) => item.id === category.parent_id);
    if (parent?.currency) return parent.currency;
  }
  return FALLBACK_CURRENCY;
}
