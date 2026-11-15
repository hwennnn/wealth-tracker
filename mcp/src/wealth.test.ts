import { describe, expect, it } from "vitest";
import type { Category, Entry, ExchangeRates } from "../../src/lib/types";
import { dashboard, history, resolveAccount, snapshots } from "./wealth";

const rates: ExchangeRates = { base: "USD", rates: { USD: 1, SGD: 1.25 }, lastUpdated: "2026-11-15" };
const cat = (id: string, name: string, extra: Partial<Category> = {}): Category => ({
  id, name, created_at: "2026-01-01", user_id: "u", kind: "asset", parent_id: null, currency: "SGD", ...extra,
});
const categories = [
  cat("dbs", "DBS"),
  cat("chase", "Chase", { currency: "USD" }),
  cat("venture", "Venture", { kind: "credit_card", parent_id: "chase", currency: "USD" }),
];
const row = (id: string, category_id: string, amount: number, currency: string, date: string): Entry => ({
  id, category_id, amount, currency, date, user_id: "u",
});
const entries = [
  row("1", "dbs", 1250, "SGD", "2026-11-15"),
  row("2", "chase", 1000, "USD", "2026-11-15"),
  row("3", "venture", 200, "USD", "2026-11-15"),
  row("4", "dbs", 625, "SGD", "2026-10-15"),
];

describe("wealth views", () => {
  it("groups entries into snapshots, newest first", () => {
    expect(snapshots(entries).map((s) => s.date)).toEqual(["2026-11-15", "2026-10-15"]);
  });

  it("matches the dashboard maths: assets minus cards, converted", () => {
    const d = dashboard(categories, entries, "USD", rates) as Record<string, unknown>;
    expect(d.net_worth).toBe(1800); // 1000 SGD→USD + 1000 − 200
    expect(d.credit_card_debt).toBe(200);
    expect(d.change_vs_previous).toBe(1300);
    const regions = d.regions as { currency: string; net_in_region_currency: number }[];
    expect(regions.map((r) => [r.currency, r.net_in_region_currency])).toEqual([["SGD", 1250], ["USD", 800]]);
  });

  it("returns an account's series including its cards", () => {
    expect(history(categories, entries, "USD", rates, { accountId: "chase" }).at(-1)?.net).toBe(800);
  });

  it("resolves accounts by name, case-insensitively", () => {
    expect(resolveAccount(categories, "chase").id).toBe("chase");
    expect(() => resolveAccount(categories, "Nope")).toThrow(/Known accounts/);
  });
});
