import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
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

  const convertEntry = (amount: number, from: string) => {
    if (!exchangeRates || from === currency) return amount;
    return convertAmount(amount, from, currency, exchangeRates);
  };

  const convertedEntries = entries.map((entry) => ({
    ...entry,
    convertedAmount: convertEntry(entry.amount, entry.currency),
  }));

  const convertedTotal = convertedEntries.reduce(
    (sum, e) => sum + e.convertedAmount,
    0
  );

  // Month-over-month change
  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const previousTimeline = sorted.length > 1 ? sorted[1] : null;
  const previousTotal = previousTimeline
    ? previousTimeline.entries.reduce(
        (sum, e) => sum + convertEntry(e.amount, e.currency),
        0
      )
    : null;

  const change =
    previousTotal !== null ? convertedTotal - previousTotal : null;
  const changePct =
    previousTotal !== null && previousTotal !== 0
      ? ((convertedTotal - previousTotal) / previousTotal) * 100
      : null;

  // Active goal
  const activeGoal = goals[0] || null;
  const goalProgress =
    activeGoal && activeGoal.targetAmount > 0
      ? Math.min((convertedTotal / activeGoal.targetAmount) * 100, 100)
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
          <p className="text-xs text-muted-foreground mt-1">
            {entries.length} asset{entries.length !== 1 ? "s" : ""} tracked
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
              {goalProgress.toFixed(0)}% reached
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
      </CardContent>
    </Card>
  );
};

export default WealthSummaryCard;
