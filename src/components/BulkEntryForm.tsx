import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkEntryRow, Category, Currency } from "@/lib/types";
import { toast } from "sonner";

type BulkEntryFormProps = {
  categories: Category[];
  currencies: Currency[];
  onSubmit: (
    entries: {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[]
  ) => Promise<void>;
};

function createEmptyRow(defaultCategory: string, defaultCurrency: string): BulkEntryRow {
  return {
    id: crypto.randomUUID(),
    categoryId: defaultCategory,
    amount: "",
    currencyCode: defaultCurrency,
    notes: "",
  };
}

const BulkEntryForm = ({
  categories,
  currencies,
  onSubmit,
}: BulkEntryFormProps) => {
  const defaultCat = categories[0]?.id || "";
  const defaultCur = "SGD";

  const [date, setDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<BulkEntryRow[]>(() =>
    categories.length > 0
      ? categories.map((cat) => createEmptyRow(cat.id, defaultCur))
      : [createEmptyRow(defaultCat, defaultCur)]
  );
  const [isLoading, setIsLoading] = useState(false);
  const initializedRef = useRef(false);

  // Re-initialize rows when categories load for the first time
  useEffect(() => {
    if (categories.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setRows(categories.map((cat) => createEmptyRow(cat.id, defaultCur)));
    }
  }, [categories, defaultCur]);

  const updateRow = (id: string, field: keyof BulkEntryRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow(defaultCat, defaultCur)]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = rows.filter((r) => {
      const amt = parseFloat(r.amount);
      return r.categoryId && !isNaN(amt) && amt >= 0;
    });

    if (validRows.length === 0) {
      toast.error("Please fill in at least one row with a valid amount");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(
        validRows.map((r) => ({
          categoryId: r.categoryId,
          amount: parseFloat(r.amount),
          currencyCode: r.currencyCode,
          date,
          notes: r.notes,
        }))
      );
      toast.success(`${validRows.length} entries saved successfully`);
      // Reset rows with categories pre-filled
      setRows(
        categories.length > 0
          ? categories.map((cat) => createEmptyRow(cat.id, defaultCur))
          : [createEmptyRow(defaultCat, defaultCur)]
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save entries"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Record Wealth Snapshot
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Snapshot Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-64 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_1fr_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Category</span>
            <span>Amount</span>
            <span>Currency</span>
            <span>Notes</span>
            <span></span>
          </div>

          {/* Entry rows */}
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_1fr_40px] gap-2 items-start p-3 sm:p-0 rounded-lg sm:rounded-none bg-muted/30 sm:bg-transparent"
              >
                <Select
                  value={row.categoryId}
                  onValueChange={(v) => updateRow(row.id, "categoryId", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={row.amount}
                  onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="h-9 text-sm"
                />

                <Select
                  value={row.currencyCode}
                  onValueChange={(v) => updateRow(row.id, "currencyCode", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={row.notes}
                  onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-9 text-sm"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? "Saving..." : "Save All Entries"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default BulkEntryForm;
