import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, CreditCard, CreditCardStatement, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { dateKey, netPosition, todayKey } from "@/lib/netWorth";
import { TrendingUp, TrendingDown, Minus, Target, CreditCard as CreditCardIcon } from "lucide-react";
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
  cards: CreditCard[];
  statements: CreditCardStatement[];
};

const WealthSummaryCard = ({
  entries,
  currency,
  categories,
  exchangeRates,
  timelineEntries,
  goals,
  cards,
  statements,
}: WealthSummaryProps) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const categoryOrder = categories.map((category) => category.id);

  const current = netPosition({
    entries,
    cards,
    statements,
    displayCurrency: currency,
    exchangeRates,
    categoryOrder,
    asOf: todayKey(),
  });

  const convertEntry = (amount: number, from: string) => {
    if (!exchangeRates || from === currency) return amount;
    return convertAmount(amount, from, currency, exchangeRates);
  };

  const convertedEntries = entries.map((entry) => ({
    ...entry,
    convertedAmount: convertEntry(entry.amount, entry.currency),
  }));

  // Month-over-month change compares net worth, after cards outstanding on each date.
  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const previousTimeline = sorted.length > 1 ? sorted[1] : null;
  const previous = previousTimeline
    ? netPosition({
        entries: previousTimeline.entries,
        cards,
        statements,
        displayCurrency: currency,
        exchangeRates,
        asOf: dateKey(previousTimeline.date),
        categoryOrder,
      })
    : null;

  const convertedTotal = current.net;
  const change = previous ? convertedTotal - previous.net : null;
  const changePct =
    previous && previous.net !== 0
      ? ((convertedTotal - previous.net) / previous.net) * 100
      : null;
  const billedCards = current.cards.filter((card) => card.statementId);

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
            {entries.length} asset{entries.length !== 1 ? "s" : ""}
            {billedCards.length > 0 &&
              ` · ${billedCards.length} card${billedCards.length !== 1 ? "s" : ""}`}
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
              {current.liabilities > 0 ? ", after cards" : ""}
            </p>
          </div>
        )}

        {/* Asset breakdown */}
        <div className="space-y-1">
          {convertedEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
            >
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium truncate">
                  {categoryMap.get(entry.category_id) || "Uncategorized"}
                </p>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.notes}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(entry.convertedAmount, currency)}
                </p>
                {entry.currency !== currency && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(entry.amount, entry.currency)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {billedCards.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCardIcon className="h-3.5 w-3.5" />
              Credit cards
            </p>
            {billedCards.map((outstanding) => (
              <div
                key={outstanding.cardId}
                className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium truncate">
                    {cardMap.get(outstanding.cardId)?.name || "Card"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {categoryMap.get(outstanding.categoryId) || "Account"}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-red-500">
                  {formatCurrency(-outstanding.convertedAmount, currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WealthSummaryCard;
