import { useEffect, useState } from "react";
import WealthChart from "@/components/WealthChart";
import WealthSummaryCard from "@/components/WealthSummaryCard";
import CategoryTrends from "@/components/CategoryTrends";
import GoalDialog from "@/components/GoalDialog";
import { Button } from "@/components/ui/button";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import { ArrowRight, Download, Plus, Tag, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { convertAmount, formatCurrency } from "@/lib/currency";
import {
  WealthGoal,
  getGoals,
  getNewMilestones,
  celebrateMilestone,
} from "@/lib/goals";
import { exportEntriesToCSV, downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

type DashboardProps = {
  timelineEntries: TimelineEntry[];
  latestEntries: Entry[];
  totalAmount: number;
  displayCurrency: string;
  categories: Category[];
  exchangeRates: ExchangeRates | null;
  allEntries: Entry[];
};

const Dashboard = ({
  timelineEntries,
  latestEntries,
  totalAmount,
  displayCurrency,
  categories,
  exchangeRates,
  allEntries,
}: DashboardProps) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<WealthGoal[]>(getGoals);

  const refreshGoals = () => setGoals(getGoals());

  // Calculate converted total for milestones
  const convertedTotal = latestEntries.reduce((sum, e) => {
    if (!exchangeRates || e.currency === displayCurrency) return sum + e.amount;
    return sum + convertAmount(e.amount, e.currency, displayCurrency, exchangeRates);
  }, 0);

  // Check for milestones
  useEffect(() => {
    if (convertedTotal <= 0) return;
    const newMilestones = getNewMilestones(convertedTotal);
    for (const milestone of newMilestones) {
      celebrateMilestone(milestone);
      toast.success(
        `Milestone reached: ${formatCurrency(milestone, displayCurrency, true)}!`,
        { duration: 6000 }
      );
    }
  }, [convertedTotal, displayCurrency]);

  const handleExport = () => {
    const csv = exportEntriesToCSV(allEntries, categories);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `wealth-tracker-export-${date}.csv`);
    toast.success("Data exported successfully");
  };

  if (timelineEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome to WealthTracker
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md text-sm sm:text-base">
          Start by creating categories for your assets, then record your first
          wealth snapshot.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/categories")}
            variant="outline"
            className="gap-2"
          >
            <Tag className="h-4 w-4" />
            Create Categories
          </Button>
          <Button onClick={() => navigate("/new-entry")} className="gap-2">
            <Plus className="h-4 w-4" />
            Record First Entry
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const sortedTimeline = [...timelineEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Your financial overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GoalDialog
            goals={goals}
            currency={displayCurrency}
            onGoalsChange={refreshGoals}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/new-entry")}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Entry
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <WealthSummaryCard
            entries={latestEntries}
            totalAmount={totalAmount}
            currency={displayCurrency}
            categories={categories}
            exchangeRates={exchangeRates}
            timelineEntries={timelineEntries}
            goals={goals}
          />
        </div>
        <div className="lg:col-span-8">
          <WealthChart
            timelineData={sortedTimeline}
            latestEntries={latestEntries}
            currency={displayCurrency}
            categories={categories}
            exchangeRates={exchangeRates}
          />
        </div>
      </div>

      {/* Category trends */}
      <CategoryTrends
        timelineEntries={timelineEntries}
        categories={categories}
        currency={displayCurrency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
};

export default Dashboard;
