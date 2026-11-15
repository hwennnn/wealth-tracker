import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionHeading } from "@/components/CurrencyChip";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { isCreditCard, orderCategories } from "@/lib/netWorth";
import { Category, Entry, ExchangeRates } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreditCard, Globe2 } from "lucide-react";
import { ConvertedEntry, RegionGroup, groupByRegion } from "./WealthSummaryCard";

type RegionAccountsProps = {
  entries: Entry[];
  categories: Category[];
  currency: string;
  exchangeRates: ExchangeRates | null;
};

/** Latest snapshot, one column per region, amounts as recorded with ≈ display currency below. */
const RegionAccounts = ({ entries, categories, currency, exchangeRates }: RegionAccountsProps) => {
  const converted = entries.map((entry) => ({
    ...entry,
    convertedAmount:
      exchangeRates && entry.currency !== currency
        ? convertAmount(Number(entry.amount), entry.currency, currency, exchangeRates)
        : Number(entry.amount),
  }));
  const groups = groupByRegion(converted, categories);
  if (groups.length === 0) return null;
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            Accounts by region
          </CardTitle>
          <span className="text-xs text-muted-foreground">As recorded · ≈ in {currency}</span>
        </div>
      </CardHeader>
      <CardContent>
        <SummaryRows groups={groups} categories={categories} currency={currency} categoryMap={categoryMap} />
      </CardContent>
    </Card>
  );
};

function SummaryRows({
  groups,
  categories,
  currency,
  categoryMap,
}: {
  groups: RegionGroup[];
  categories: Category[];
  currency: string;
  categoryMap: Map<string, string>;
}) {
  const order = new Map(orderCategories(categories).map((category, index) => [category.id, index]));

  const blocksFor = (entries: ConvertedEntry[]) => {
    const sorted = entries
      .slice()
      .sort((a, b) => (order.get(a.category_id) ?? 999) - (order.get(b.category_id) ?? 999));
    const blocks: { lead: ConvertedEntry | null; cards: ConvertedEntry[] }[] = [];
    for (const entry of sorted) {
      const category = categories.find((item) => item.id === entry.category_id);
      const bank =
        isCreditCard(category) && category?.parent_id
          ? categories.find((item) => item.id === category.parent_id && !isCreditCard(item))
          : undefined;
      const previous = blocks[blocks.length - 1];
      if (bank && previous && previous.lead?.category_id === bank.id) {
        previous.cards.push(entry);
      } else if (!bank) {
        blocks.push({ lead: entry, cards: [] });
      } else {
        blocks.push({ lead: null, cards: [entry] });
      }
    }
    return blocks;
  };

  const line = (entry: ConvertedEntry, showBank: boolean) => {
    const category = categories.find((item) => item.id === entry.category_id);
    const card = isCreditCard(category);
    const bank = card && category?.parent_id
      ? categories.find((item) => item.id === category.parent_id && !isCreditCard(item))
      : undefined;
    const native = card ? -Number(entry.amount) : Number(entry.amount);
    const converted = card ? -entry.convertedAmount : entry.convertedAmount;
    return (
      <div
        key={entry.id}
        className="flex min-h-11 items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0"
        title={bank ? `Linked to ${bank.name}` : undefined}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {card && <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{categoryMap.get(entry.category_id) || "Uncategorized"}</span>
          </p>
          {(entry.notes || (showBank && bank)) && (
            <p className="truncate text-xs text-muted-foreground">
              {showBank && bank ? `${bank.name}${entry.notes ? " · " : ""}` : ""}
              {entry.notes}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={cn("text-sm font-semibold tabular-nums", card && "text-red-500")}>
            {formatCurrency(native, entry.currency)}
          </p>
          {entry.currency !== currency && (
            <p className="text-xs tabular-nums text-muted-foreground">
              ≈ {formatCurrency(converted, currency)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
      {groups.map((group) => (
        <section key={group.currency}>
          <RegionHeading currency={group.currency} className="border-b pb-2">
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(group.native, group.currency)}
            </p>
          </RegionHeading>
          {blocksFor(group.entries).map((block, index) => (
            <div key={block.lead?.id ?? `cards-${index}`}>
              {block.lead && line(block.lead, true)}
              {block.cards.length > 0 && (
                <div className="relative ml-2 border-l border-foreground/30">
                  {block.cards.map((entry, cardIndex) => (
                    <div key={entry.id} className="relative pl-3">
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-foreground/30"
                      />
                      {cardIndex === block.cards.length - 1 && (
                        <span aria-hidden className="absolute -left-px top-1/2 bottom-0 w-px bg-card" />
                      )}
                      {line(entry, false)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export default RegionAccounts;
