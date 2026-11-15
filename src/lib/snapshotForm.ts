import { netPosition } from "./netWorth";
import type { ExchangeRates } from "./types";

export type StatementDraft = {
  cardId: string;
  cardName: string;
  balance: string;
  currency: string;
};

export type ParsedStatement = {
  creditCardId: string;
  balanceOwed: number;
  currency: string;
};

/**
 * Blank means "no statement this snapshot". A filled value must be zero or more.
 * Invalid text blocks the save so a bad card balance is not dropped silently.
 */
export function parseSnapshotStatements(
  drafts: StatementDraft[]
): { ok: true; statements: ParsedStatement[] } | { ok: false; error: string } {
  const statements: ParsedStatement[] = [];
  for (const draft of drafts) {
    const raw = draft.balance.trim();
    if (!raw) continue;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      return {
        ok: false,
        error: `${draft.cardName}: statement balance must be zero or more, or left blank.`,
      };
    }
    if (!draft.currency) {
      return { ok: false, error: `${draft.cardName}: choose a currency.` };
    }
    statements.push({
      creditCardId: draft.cardId,
      balanceOwed: amount,
      currency: draft.currency,
    });
  }
  return { ok: true, statements };
}

export function snapshotPreview(input: {
  assets: { amount: number; currency: string }[];
  statements: ParsedStatement[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
}): { assets: number; liabilities: number; net: number } {
  const position = netPosition({
    entries: input.assets.map((asset) => ({
      category_id: "snapshot",
      amount: asset.amount,
      currency: asset.currency,
    })),
    cards: input.statements.map((statement) => ({
      id: statement.creditCardId,
      category_id: "snapshot",
    })),
    statements: input.statements.map((statement) => ({
      id: statement.creditCardId,
      credit_card_id: statement.creditCardId,
      statement_date: "2000-01-01",
      balance_owed: statement.balanceOwed,
      currency: statement.currency,
    })),
    displayCurrency: input.displayCurrency,
    exchangeRates: input.exchangeRates,
  });
  return {
    assets: position.assets,
    liabilities: position.liabilities,
    net: position.net,
  };
}
