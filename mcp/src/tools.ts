import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertAmount, formatCurrency } from "../../src/lib/money";
import { defaultCurrencyFor } from "../../src/lib/regions";
import type { Category, Entry, ExchangeRates } from "../../src/lib/types";
import type { Db } from "./db";
import {
  dashboard,
  describeAccount,
  history,
  listAccounts,
  regionBreakdown,
  resolveAccount,
  snapshotList,
  snapshots,
} from "./wealth";

export const SUPPORTED_CURRENCIES = ["SGD", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CNY", "HKD"] as const;

const currency = z
  .string()
  .regex(/^[A-Za-z]{3}$/, "3-letter ISO code, e.g. SGD or USD")
  .transform((code) => code.toUpperCase());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const INSTRUCTIONS = `WealthTracker: one person's net worth, tracked as periodic snapshots.

Model
- An account is a bank, broker, wallet or other asset (kind "asset"), or a credit card (kind "credit_card").
  A card can belong to a bank account (its "bank").
- Every account has a home currency (e.g. SGD for Singapore banks, USD for US banks). New rows default to it.
- A snapshot is all rows recorded on one date. Each row = one account's balance on that date, in a currency.
  For a credit card the amount is the balance OWED, as a positive number; it subtracts from net worth.
- Net worth on a date = asset rows minus credit-card rows on that same date, converted to a display currency
  at current exchange rates. Nothing carries forward between dates.

How to work
- Start with get_dashboard for the current picture (same numbers as the web dashboard).
- To record balances, call record_snapshot once with every account's balance for that date. Rows for an account
  that already has a row on that date are updated, not duplicated.
- Accounts can be referred to by id or by name.
- delete_account and delete_entries are permanent; they need confirm: true. Confirm with the user first.`;

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function fail(error: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
  };
}

type Deps = {
  db: Db;
  getRates: () => Promise<ExchangeRates>;
  defaultDisplayCurrency: string;
};

export function registerTools(server: McpServer, { db, getRates, defaultDisplayCurrency }: Deps) {
  const load = () =>
    db.asUser(async (client) => {
      const [cats, ents] = await Promise.all([
        client.query<Category>("SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at", [db.userId]),
        client.query<Entry>("SELECT * FROM entries WHERE user_id = $1 ORDER BY date DESC, created_at", [db.userId]),
      ]);
      return { categories: cats.rows, entries: ents.rows };
    });

  const rates = async () => {
    try {
      return await getRates();
    } catch {
      return null;
    }
  };

  const display = (code?: string) => (code ?? defaultDisplayCurrency).toUpperCase();

  const safe =
    <A>(fn: (args: A) => Promise<unknown>) =>
    async (args: A) => {
      try {
        return text(await fn(args));
      } catch (error) {
        return fail(error);
      }
    };

  // ---------- Read ----------

  server.registerTool(
    "get_dashboard",
    {
      title: "Dashboard",
      description:
        "Current net worth from the latest snapshot, change vs the previous snapshot, assets vs credit card debt, " +
        "and every row grouped by region/currency (amount as recorded plus converted). Same numbers as the web dashboard.",
      inputSchema: { display_currency: currency.optional().describe(`Defaults to ${defaultDisplayCurrency}`) },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ display_currency }) => {
      const { categories, entries } = await load();
      return dashboard(categories, entries, display(display_currency), await rates());
    })
  );

  server.registerTool(
    "list_accounts",
    {
      title: "List accounts",
      description: "All accounts (assets and credit cards) with id, kind, home currency, region and linked bank.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    safe(async () => {
      const { categories } = await load();
      return listAccounts(categories);
    })
  );

  server.registerTool(
    "list_snapshots",
    {
      title: "List snapshots",
      description: "Snapshot dates, newest first, with net worth, assets and credit card debt for each.",
      inputSchema: {
        display_currency: currency.optional(),
        limit: z.number().int().min(1).max(500).optional().describe("Default 24"),
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ display_currency, limit }) => {
      const { categories, entries } = await load();
      return snapshotList(categories, entries, display(display_currency), await rates(), limit ?? 24);
    })
  );

  server.registerTool(
    "get_snapshot",
    {
      title: "Get snapshot",
      description:
        "Every row recorded on one date (with entry ids for update_entry / delete_entries), grouped by region. " +
        "Omit date for the latest snapshot.",
      inputSchema: { date: isoDate.optional(), display_currency: currency.optional() },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ date, display_currency }) => {
      const { categories, entries } = await load();
      const all = snapshots(entries);
      const snapshot = date ? all.find((item) => item.date === date) : all[0];
      if (!snapshot) {
        throw new Error(
          date
            ? `No snapshot on ${date}. Dates with snapshots: ${all.slice(0, 12).map((s) => s.date).join(", ")}`
            : "No snapshots yet."
        );
      }
      const shown = display(display_currency);
      const r = await rates();
      return {
        display_currency: shown,
        ...snapshotList(categories, snapshot.entries, shown, r, 1)[0],
        regions: regionBreakdown(snapshot.entries, categories, shown, r),
      };
    })
  );

  server.registerTool(
    "get_history",
    {
      title: "Net worth history",
      description:
        "Net worth, assets and credit card debt at every snapshot date (oldest first), converted at current rates. " +
        "Pass account to get one account's series (a bank's series includes its linked cards).",
      inputSchema: {
        display_currency: currency.optional(),
        account: z.string().optional().describe("Account id or name"),
        from: isoDate.optional(),
        to: isoDate.optional(),
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ display_currency, account, from, to }) => {
      const { categories, entries } = await load();
      const accountId = account ? resolveAccount(categories, account).id : undefined;
      return {
        display_currency: display(display_currency),
        account: accountId ? categories.find((c) => c.id === accountId)?.name : "all",
        points: history(categories, entries, display(display_currency), await rates(), { accountId, from, to }),
      };
    })
  );

  server.registerTool(
    "convert_currency",
    {
      title: "Convert currency",
      description: "Convert an amount between currencies at the same rates the dashboard uses.",
      inputSchema: { amount: z.number(), from: currency, to: currency },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ amount, from, to }) => {
      const r = await getRates();
      if (!r.rates[from] || !r.rates[to]) throw new Error(`Unknown currency ${!r.rates[from] ? from : to}`);
      const result = convertAmount(amount, from, to, r);
      return {
        amount,
        from,
        to,
        result: Math.round(result * 100) / 100,
        formatted: formatCurrency(result, to),
        rate: r.rates[to] / r.rates[from],
        rates_as_of: r.lastUpdated,
      };
    })
  );

  // ---------- Write: accounts ----------

  const accountFields = {
    name: z.string().min(1).max(120),
    kind: z.enum(["asset", "credit_card"]).optional().describe('Default "asset"'),
    currency: currency.optional().describe("Home currency. Default: the bank's for a card, else SGD"),
    bank: z.string().optional().describe("Credit cards only: the bank account (id or name) it belongs to"),
    description: z.string().max(500).optional(),
  };

  server.registerTool(
    "create_account",
    {
      title: "Create account",
      description: "Add an asset account or a credit card.",
      inputSchema: accountFields,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    safe(async (args) => {
      const { categories } = await load();
      const kind = args.kind ?? "asset";
      if (args.bank && kind !== "credit_card") throw new Error("Only a credit card can have a bank.");
      const bank = args.bank ? resolveAccount(categories, args.bank) : null;
      if (bank && bank.kind === "credit_card") throw new Error(`${bank.name} is a card, not a bank.`);
      const home = args.currency ?? bank?.currency ?? "SGD";
      const row = await db.asUser(async (client) => {
        const { rows } = await client.query<Category>(
          `INSERT INTO categories (name, description, kind, parent_id, currency, user_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [args.name.trim(), args.description ?? null, kind, bank?.id ?? null, home, db.userId]
        );
        return rows[0];
      });
      return { created: describeAccount(row, [...categories, row]) };
    })
  );

  server.registerTool(
    "update_account",
    {
      title: "Update account",
      description:
        "Rename an account, change its home currency, description, kind, or linked bank. Only the fields you pass change. " +
        "Changing the home currency does not change rows already recorded.",
      inputSchema: {
        account: z.string().describe("Account id or name"),
        name: accountFields.name.optional(),
        kind: accountFields.kind,
        currency: currency.optional(),
        bank: z.string().nullable().optional().describe("Bank id or name, or null to unlink"),
        description: z.string().max(500).nullable().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    safe(async (args) => {
      const { categories } = await load();
      const target = resolveAccount(categories, args.account);
      const kind = args.kind ?? (target.kind === "credit_card" ? "credit_card" : "asset");
      let parentId = target.parent_id ?? null;
      if (args.bank === null) parentId = null;
      else if (args.bank !== undefined) {
        const bank = resolveAccount(categories, args.bank);
        if (bank.kind === "credit_card") throw new Error(`${bank.name} is a card, not a bank.`);
        if (bank.id === target.id) throw new Error("An account cannot be its own bank.");
        parentId = bank.id;
      }
      if (kind === "asset") parentId = null;
      const row = await db.asUser(async (client) => {
        const { rows } = await client.query<Category>(
          `UPDATE categories SET name = $1, description = $2, kind = $3, parent_id = $4, currency = $5
           WHERE id = $6 AND user_id = $7 RETURNING *`,
          [
            args.name?.trim() ?? target.name,
            args.description === undefined ? target.description ?? null : args.description,
            kind,
            parentId,
            args.currency ?? target.currency ?? null,
            target.id,
            db.userId,
          ]
        );
        return rows[0];
      });
      return { updated: describeAccount(row, categories.map((c) => (c.id === row.id ? row : c))) };
    })
  );

  server.registerTool(
    "delete_account",
    {
      title: "Delete account",
      description:
        "Permanently delete an account AND every row ever recorded for it. Cards linked to it are unlinked, not deleted. " +
        "Cannot be undone; ask the user first and pass confirm: true.",
      inputSchema: { account: z.string().describe("Account id or name"), confirm: z.literal(true) },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    safe(async ({ account }) => {
      const { categories, entries } = await load();
      const target = resolveAccount(categories, account);
      const rowCount = entries.filter((entry) => entry.category_id === target.id).length;
      await db.asUser((client) =>
        client.query("DELETE FROM categories WHERE id = $1 AND user_id = $2", [target.id, db.userId])
      );
      return { deleted: target.name, rows_deleted: rowCount };
    })
  );

  // ---------- Write: snapshots ----------

  server.registerTool(
    "record_snapshot",
    {
      title: "Record snapshot",
      description:
        "Record balances for one date, like the web app's snapshot form. Each row's currency defaults to the account's " +
        "home currency. For credit cards pass the balance owed as a positive number. If an account already has a row " +
        "on that date it is updated instead of duplicated. Returns the new dashboard totals for that date.",
      inputSchema: {
        date: isoDate.optional().describe("Defaults to today (UTC)"),
        rows: z
          .array(
            z.object({
              account: z.string().describe("Account id or name"),
              amount: z.number().min(0),
              currency: currency.optional(),
              notes: z.string().max(500).optional(),
            })
          )
          .min(1)
          .max(200),
        display_currency: currency.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    safe(async ({ date, rows, display_currency }) => {
      const { categories } = await load();
      const day = date ?? new Date().toISOString().slice(0, 10);
      const resolved = rows.map((row) => {
        const category = resolveAccount(categories, row.account);
        return { ...row, category, currency: row.currency ?? defaultCurrencyFor(category, categories) };
      });
      const seen = new Set<string>();
      for (const row of resolved) {
        if (seen.has(row.category.id)) throw new Error(`${row.category.name} appears twice in rows.`);
        seen.add(row.category.id);
      }

      const outcome = await db.asUser(async (client) => {
        const written: { account: string; amount: number; currency: string; action: "inserted" | "updated" }[] = [];
        for (const row of resolved) {
          const existing = await client.query<{ id: string }>(
            "SELECT id FROM entries WHERE user_id = $1 AND category_id = $2 AND date = $3 ORDER BY created_at",
            [db.userId, row.category.id, day]
          );
          if (existing.rows.length > 0) {
            const [keep, ...extra] = existing.rows;
            await client.query(
              "UPDATE entries SET amount = $1, currency = $2, notes = COALESCE($3, notes) WHERE id = $4",
              [row.amount, row.currency, row.notes ?? null, keep.id]
            );
            if (extra.length) {
              await client.query("DELETE FROM entries WHERE id = ANY($1::uuid[])", [extra.map((e) => e.id)]);
            }
            written.push({ account: row.category.name, amount: row.amount, currency: row.currency, action: "updated" });
          } else {
            await client.query(
              `INSERT INTO entries (category_id, amount, currency, date, notes, user_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [row.category.id, row.amount, row.currency, day, row.notes ?? "", db.userId]
            );
            written.push({ account: row.category.name, amount: row.amount, currency: row.currency, action: "inserted" });
          }
        }
        return written;
      });

      const after = await load();
      const snapshot = snapshots(after.entries).find((item) => item.date === day);
      const shown = display(display_currency);
      return {
        date: day,
        written: outcome,
        snapshot_totals: snapshot ? snapshotList(after.categories, snapshot.entries, shown, await rates(), 1)[0] : null,
        accounts_not_in_this_snapshot: after.categories
          .filter((category) => !snapshot?.entries.some((entry) => entry.category_id === category.id))
          .map((category) => category.name),
      };
    })
  );

  server.registerTool(
    "update_entry",
    {
      title: "Update entry",
      description: "Change one recorded row (amount, currency, notes, account, or date). Get entry ids from get_snapshot.",
      inputSchema: {
        entry_id: z.string().uuid(),
        amount: z.number().min(0).optional(),
        currency: currency.optional(),
        notes: z.string().max(500).optional(),
        account: z.string().optional().describe("Move the row to another account (id or name)"),
        date: isoDate.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    safe(async (args) => {
      const { categories, entries } = await load();
      const entry = entries.find((item) => item.id === args.entry_id);
      if (!entry) throw new Error(`No entry ${args.entry_id}.`);
      const category = args.account ? resolveAccount(categories, args.account) : null;
      const row = await db.asUser(async (client) => {
        const { rows } = await client.query<Entry>(
          `UPDATE entries SET amount = $1, currency = $2, notes = $3, category_id = $4, date = $5
           WHERE id = $6 AND user_id = $7 RETURNING *`,
          [
            args.amount ?? entry.amount,
            args.currency ?? entry.currency,
            args.notes ?? entry.notes ?? "",
            category?.id ?? entry.category_id,
            args.date ?? entry.date,
            entry.id,
            db.userId,
          ]
        );
        return rows[0];
      });
      return {
        updated: {
          entry_id: row.id,
          account: categories.find((c) => c.id === row.category_id)?.name,
          amount: row.amount,
          currency: row.currency,
          date: row.date,
          notes: row.notes,
        },
      };
    })
  );

  server.registerTool(
    "delete_entries",
    {
      title: "Delete entries",
      description:
        "Permanently delete recorded rows, by entry ids or every row on a date. Cannot be undone; ask the user first " +
        "and pass confirm: true.",
      inputSchema: {
        entry_ids: z.array(z.string().uuid()).optional(),
        date: isoDate.optional().describe("Delete the whole snapshot on this date"),
        confirm: z.literal(true),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    safe(async ({ entry_ids, date }) => {
      if (!entry_ids?.length && !date) throw new Error("Pass entry_ids or date.");
      const result = await db.asUser((client) =>
        entry_ids?.length
          ? client.query("DELETE FROM entries WHERE user_id = $1 AND id = ANY($2::uuid[])", [db.userId, entry_ids])
          : client.query("DELETE FROM entries WHERE user_id = $1 AND date = $2", [db.userId, date])
      );
      return { rows_deleted: result.rowCount };
    })
  );
}
