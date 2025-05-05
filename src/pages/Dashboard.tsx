import WealthChart from "@/components/WealthChart";
import WealthSummaryCard from "@/components/WealthSummaryCard";
import { Button } from "@/components/ui/button";
import { Entry, TimelineEntry } from "@/lib/types";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DashboardProps = {
  timelineEntries: TimelineEntry[];
  latestEntries: Entry[];
  totalAmount: number;
  defaultCurrency: string;
};

const Dashboard = ({
  timelineEntries,
  latestEntries,
  totalAmount,
  defaultCurrency,
}: DashboardProps) => {
  const navigate = useNavigate();

  if (timelineEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to Wealth Timeline Tracker!
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          To get started, create some categories and add your first wealth
          entry.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/categories")} variant="outline">
            Create Categories
          </Button>
          <Button onClick={() => navigate("/new-entry")}>
            <Plus className="mr-1 h-4 w-4" /> Record First Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <Button onClick={() => navigate("/new-entry")}>
          <Plus className="mr-1 h-4 w-4" /> New Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <WealthSummaryCard
            entries={latestEntries}
            totalAmount={totalAmount}
            currency={defaultCurrency}
          />
        </div>
        <div className="md:col-span-2">
          <WealthChart
            timelineData={timelineEntries.reverse()}
            latestEntries={latestEntries}
            currency={defaultCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
