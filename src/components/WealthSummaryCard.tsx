import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { isCreditCard, netPosition, orderCategories } from "@/lib/netWorth";
import { TrendingUp, TrendingDown, Minus, Target, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { WealthGoal } from "@/lib/goals";

type WealthSummaryProps = {
  entries: Entry[];
  totalAmount: number;
  currency: string;
  categories: Category[];
  exchangeRates: ExchangeRates | null;
  timelineEntries: TimelineEntry[];
  goals: WealthGoal[];
};

const WealthSummaryCard = ({
  entries,
  currency,
  categories,
  exchangeRates,
  timelineEntries,
  goals,
}: WealthSummaryProps) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const current = netPosition({
    entries,
    categories,
    displayCurrency: currency,
    exchangeRates,
  });

  const convertEntry = (amount: number, from: string) => {
    if (!exchangeRates || from === currency) return amount;
    return convertAmount(amount, from, currency, exchangeRates);
  };

  const convertedEntries = entries.map((entry) => ({
    ...entry,
    convertedAmount: convertEntry(entry.amount, entry.currency),
  }));

  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const previousTimeline = sorted.length > 1 ? sorted[1] : null;
  const previous = previousTimeline
    ? netPosition({
        entries: previousTimeline.entries,
        categories,
        displayCurrency: currency,
        exchangeRates,
      })
    : null;

  const convertedTotal = current.net;
  const change = previous ? convertedTotal - previous.net : null;
  const changePct =
    previous && previous.net !== 0
      ? ((convertedTotal - previous.net) / previous.net) * 100
      : null;

  // Active goal
  const activeGoal = goals[0] || null;
  const goalProgress =
    activeGoal && activeGoal.targetAmount > 0
      ? Math.max(0, Math.min((convertedTotal / activeGoal.targetAmount) * 100, 100))
      : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Net Worth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            {formatCurrency(convertedTotal, currency)}
          </p>
          {change !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              {change > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : change < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={`text-xs font-medium ${
                  change > 0
                    ? "text-green-500"
                    : change < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {change > 0 ? "+" : ""}
                {formatCurrency(change, currency, true)}
                {changePct !== null &&
                  ` (${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%)`}
              </span>
              <span className="text-xs text-muted-foreground">
                vs previous
              </span>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-muted/50 px-2.5 py-2">
              <p className="text-muted-foreground">Assets</p>
              <p className="font-semibold tabular-nums mt-0.5">
                {formatCurrency(current.assets, currency)}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-2.5 py-2">
              <p className="text-muted-foreground">Credit cards</p>
              <p
                className={`font-semibold tabular-nums mt-0.5 ${
                  current.liabilities > 0 ? "text-red-500" : ""
                }`}
              >
                {current.liabilities > 0
                  ? formatCurrency(-current.liabilities, currency)
                  : formatCurrency(0, currency)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {entries.length} row{entries.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Goal progress */}
        {activeGoal && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                <Target className="h-3.5 w-3.5 text-primary" />
                {activeGoal.name}
              </div>
              <span className="text-muted-foreground">
                {formatCurrency(activeGoal.targetAmount, currency, true)}
              </span>
            </div>
            <Progress value={goalProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {goalProgress.toFixed(0)}% of net worth
            </p>
          </div>
        )}

        {/* Asset breakdown */}
        <SummaryRows entries={convertedEntries} categories={categories} currency={currency} categoryMap={categoryMap} />
      </CardContent>
    </Card>
  );
};

function SummaryRows({
  entries,
  categories,
  currency,
  categoryMap,
}: {
  entries: (Entry & { convertedAmount: number })[];
  categories: Category[];
  currency: string;
  categoryMap: Map<string, string>;
}) {
  const order = new Map(orderCategories(categories).map((category, index) => [category.id, index]));
  const sorted = entries
    .slice()
    .sort((a, b) => (order.get(a.category_id) ?? 999) - (order.get(b.category_id) ?? 999));
  const blocks: { lead: (typeof sorted)[number] | null; cards: typeof sorted }[] = [];

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

  const line = (entry: (typeof sorted)[number]) => {
    const category = categories.find((item) => item.id === entry.category_id);
    const card = isCreditCard(category);
    const shown = card ? -entry.convertedAmount : entry.convertedAmount;
    const bank = card && category?.parent_id
      ? categories.find((item) => item.id === category.parent_id && !isCreditCard(item))
      : undefined;
    return (
      <div
        key={entry.id}
        className="flex items-center justify-between gap-3 border-b border-border/40 py-1.5 last:border-0"
        title={bank ? `Linked to ${bank.name}` : undefined}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {card && <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{categoryMap.get(entry.category_id) || "Uncategorized"}</span>
          </p>
          {entry.notes && (
            <p className="truncate text-xs text-muted-foreground">{entry.notes}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-sm font-semibold tabular-nums ${card ? "text-red-500" : ""}`}>
            {formatCurrency(shown, currency)}
          </p>
          {entry.currency !== currency && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatCurrency(card ? -entry.amount : entry.amount, entry.currency)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {blocks.map((block, index) => (
        <div key={block.lead?.id ?? `cards-${index}`}>
          {block.lead && line(block.lead)}
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
                  {line(entry)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default WealthSummaryCard;
