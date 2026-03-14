import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(252, 56%, 57%)",
  "hsl(24, 80%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(45, 80%, 50%)",
  "hsl(280, 55%, 55%)",
];

type CategoryTrendsProps = {
  timelineEntries: TimelineEntry[];
  categories: Category[];
  currency: string;
  exchangeRates: ExchangeRates | null;
};

const CategoryTrends = ({
  timelineEntries,
  categories,
  currency,
  exchangeRates,
}: CategoryTrendsProps) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const convertEntry = (amount: number, from: string) => {
    if (!exchangeRates || from === currency) return amount;
    return convertAmount(amount, from, currency, exchangeRates);
  };

  // Build per-category trend data
  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get unique category IDs that appear in entries
  const activeCategoryIds = new Set<string>();
  for (const t of timelineEntries) {
    for (const e of t.entries) {
      activeCategoryIds.add(e.category_id);
    }
  }

  const categoryTrends = Array.from(activeCategoryIds).map((catId) => {
    const data = sorted
      .map((t) => {
        const catEntries = t.entries.filter((e) => e.category_id === catId);
        if (catEntries.length === 0) return null;
        const total = catEntries.reduce(
          (s, e) => s + convertEntry(e.amount, e.currency),
          0
        );
        return {
          dateLabel: format(new Date(t.date), "dd MMM yy"),
          amount: Math.round(total * 100) / 100,
        };
      })
      .filter(Boolean) as { dateLabel: string; amount: number }[];

    return {
      categoryId: catId,
      name: categoryMap.get(catId) || "Unknown",
      data,
    };
  });

  if (categoryTrends.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Category Trends
        </CardTitle>
        <CardDescription>Individual asset growth over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoryTrends.map((cat, idx) => (
            <div
              key={cat.categoryId}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                {cat.data.length > 0 && (
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(
                      cat.data[cat.data.length - 1].amount,
                      currency,
                      true
                    )}
                  </span>
                )}
              </div>
              {cat.data.length >= 2 ? (
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={cat.data}
                      margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient
                          id={`catGrad-${idx}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={COLORS[idx % COLORS.length]}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor={COLORS[idx % COLORS.length]}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded border bg-card px-2 py-1 shadow text-xs">
                              <p className="text-muted-foreground">
                                {d.dateLabel}
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(d.amount, currency)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <XAxis dataKey="dateLabel" hide />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={1.5}
                        fill={`url(#catGrad-${idx})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Need 2+ snapshots
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryTrends;
