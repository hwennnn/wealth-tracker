import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { isCreditCard, netPosition } from "@/lib/netWorth";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { compareRegions, regionFor } from "@/lib/regions";
import { cn } from "@/lib/utils";
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
    convertedAmount: convertEntry(Number(entry.amount), entry.currency),
  }));
  const regionGroups = groupByRegion(convertedEntries, categories);

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Net Worth
          </span>
          <span className="text-xs font-normal text-muted-foreground">in {currency}</span>
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
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-muted-foreground">Assets</p>
              <p className="font-semibold tabular-nums mt-0.5">
                {formatCurrency(current.assets, currency)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
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
        </div>

        <RegionSplit groups={regionGroups} currency={currency} />

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

      </CardContent>
    </Card>
  );
};

export type ConvertedEntry = Entry & { convertedAmount: number };

export type RegionGroup = {
  currency: string;
  entries: ConvertedEntry[];
  /** In the region's own currency. Cards subtract. */
  native: number;
  /** In the display currency. Cards subtract. */
  converted: number;
};

/** Buckets the snapshot by the currency each row was recorded in. */
export function groupByRegion(entries: ConvertedEntry[], categories: Category[]): RegionGroup[] {
  const groups = new Map<string, RegionGroup>();
  for (const entry of entries) {
    const category = categories.find((item) => item.id === entry.category_id);
    const sign = isCreditCard(category) ? -1 : 1;
    const group = groups.get(entry.currency) ?? {
      currency: entry.currency,
      entries: [],
      native: 0,
      converted: 0,
    };
    group.entries.push(entry);
    group.native += sign * Number(entry.amount);
    group.converted += sign * entry.convertedAmount;
    groups.set(entry.currency, group);
  }
  return [...groups.values()].sort((a, b) => compareRegions(a.currency, b.currency));
}

function RegionSplit({ groups, currency }: { groups: RegionGroup[]; currency: string }) {
  const positive = groups.filter((group) => group.converted > 0);
  const total = positive.reduce((sum, group) => sum + group.converted, 0);
  if (groups.length < 2 || total <= 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {positive.map((group) => (
          <div
            key={group.currency}
            className={regionFor(group.currency).swatch}
            style={{ width: `${(group.converted / total) * 100}%` }}
            title={`${regionFor(group.currency).label}: ${((group.converted / total) * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {groups.map((group) => {
          const region = regionFor(group.currency);
          const share = total > 0 && group.converted > 0 ? (group.converted / total) * 100 : 0;
          return (
            <div key={group.currency} className="rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span className={cn("h-2 w-2 rounded-full", region.swatch)} aria-hidden />
                  <span aria-hidden>{region.flag}</span>
                  {group.currency}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{share.toFixed(0)}%</span>
              </div>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {formatCurrency(group.native, group.currency)}
              </p>
              {group.currency !== currency && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  ≈ {formatCurrency(group.converted, currency)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WealthSummaryCard;
