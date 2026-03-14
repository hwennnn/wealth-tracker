import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { format, subMonths } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type TimeRange = "3m" | "6m" | "1y" | "all";

type WealthChartProps = {
  timelineData: TimelineEntry[];
  latestEntries: Entry[];
  currency: string;
  categories: Category[];
  exchangeRates: ExchangeRates | null;
};

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(252, 56%, 57%)",
  "hsl(24, 80%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(45, 80%, 50%)",
  "hsl(280, 55%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(130, 50%, 45%)",
];

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

const WealthChart = ({
  timelineData,
  latestEntries,
  currency,
  categories,
  exchangeRates,
}: WealthChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const convertedAmount = (amount: number, fromCurrency: string) => {
    if (!exchangeRates || fromCurrency === currency) return amount;
    return convertAmount(amount, fromCurrency, currency, exchangeRates);
  };

  const now = new Date();
  const rangeStart =
    timeRange === "3m"
      ? subMonths(now, 3)
      : timeRange === "6m"
        ? subMonths(now, 6)
        : timeRange === "1y"
          ? subMonths(now, 12)
          : null;

  const filteredTimeline = rangeStart
    ? timelineData.filter((t) => new Date(t.date) >= rangeStart)
    : timelineData;

  const lineChartData = filteredTimeline
    .map((timeline) => {
      const converted = timeline.entries.reduce(
        (sum, e) => sum + convertedAmount(e.amount, e.currency),
        0
      );
      return {
        date: new Date(timeline.date).getTime(),
        dateLabel: format(new Date(timeline.date), "dd MMM yy"),
        amount: Math.round(converted * 100) / 100,
      };
    })
    .sort((a, b) => a.date - b.date);

  const pieChartData = latestEntries
    .map((entry) => ({
      name: categoryMap.get(entry.category_id) || entry.notes || "Unknown",
      value:
        Math.round(convertedAmount(entry.amount, entry.currency) * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const totalPieValue = pieChartData.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="text-xs text-muted-foreground mb-0.5">
          {data.dateLabel}
        </p>
        <p className="font-semibold">
          {formatCurrency(data.amount, currency)}
        </p>
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const pct =
      totalPieValue > 0
        ? ((data.value / totalPieValue) * 100).toFixed(1)
        : "0";
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium mb-0.5">{data.name}</p>
        <p className="font-semibold">
          {formatCurrency(data.value, currency)}
        </p>
        <p className="text-xs text-muted-foreground">{pct}%</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Wealth Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Wealth Growth
              </CardTitle>
              <CardDescription>Net worth over time</CardDescription>
            </div>
            <div className="flex gap-1">
              {TIME_RANGES.map((r) => (
                <Button
                  key={r.key}
                  variant={timeRange === r.key ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setTimeRange(r.key)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[280px]">
            {lineChartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Add at least 2 snapshots to see the growth chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lineChartData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="areaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(220, 70%, 50%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(220, 70%, 50%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v, currency, true)}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(220, 70%, 50%)"
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "hsl(220, 70%, 50%)",
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Asset Distribution
          </CardTitle>
          <CardDescription>Breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          {pieChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              No data to display
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Pie chart */}
              <div className="w-full sm:w-2/5 h-[200px] sm:h-[240px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieChartData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="w-full sm:w-3/5 grid grid-cols-1 gap-1.5">
                {pieChartData.map((item, index) => {
                  const pct =
                    totalPieValue > 0
                      ? ((item.value / totalPieValue) * 100).toFixed(1)
                      : "0";
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm flex-1 min-w-0 truncate">
                        {item.name}
                      </span>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(item.value, currency, true)}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WealthChart;
