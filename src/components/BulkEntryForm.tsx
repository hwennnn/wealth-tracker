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
import { CalendarIcon, CreditCard, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { orderCategories, isCreditCard } from "@/lib/netWorth";
import { BulkEntryRow, Category, Currency } from "@/lib/types";
import { compareRegions, defaultCurrencyFor, regionFor } from "@/lib/regions";
import { currencySymbol, formatCurrency } from "@/lib/currency";
import { RegionHeading } from "@/components/CurrencyChip";
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

/** Banks (each followed by its cards) ordered by region, keeping the existing order inside a region. */
function regionOrdered(categories: Category[]): Category[] {
  const ordered = orderCategories(categories);
  const groups: Category[][] = [];
  for (const category of ordered) {
    const bank = parentBank(category, categories);
    const last = groups[groups.length - 1];
    if (bank && last && last[0].id === bank.id) last.push(category);
    else groups.push([category]);
  }
  return groups
    .map((group, index) => ({ group, index, currency: defaultCurrencyFor(group[0], categories) }))
    .sort((a, b) => compareRegions(a.currency, b.currency) || a.index - b.index)
    .flatMap((item) => item.group);
}

function rowsFor(categories: Category[]): BulkEntryRow[] {
  return regionOrdered(categories).map((category) =>
    createEmptyRow(category.id, defaultCurrencyFor(category, categories))
  );
}

function parentBank(category: Category | undefined, categories: Category[]): Category | null {
  if (!category || !isCreditCard(category) || !category.parent_id) return null;
  const parent = categories.find((item) => item.id === category.parent_id);
  if (!parent || isCreditCard(parent)) return null;
  return parent;
}

function segmentRows(rows: BulkEntryRow[], categories: Category[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const segments: { lead: BulkEntryRow; cards: BulkEntryRow[] }[] = [];
  let index = 0;
  while (index < rows.length) {
    const lead = rows[index];
    const category = byId.get(lead.categoryId);
    const cards: BulkEntryRow[] = [];
    if (category && !isCreditCard(category)) {
      let next = index + 1;
      while (next < rows.length) {
        const child = byId.get(rows[next].categoryId);
        if (child && isCreditCard(child) && child.parent_id === category.id) {
          cards.push(rows[next]);
          next += 1;
        } else {
          break;
        }
      }
      segments.push({ lead, cards });
      index = next;
    } else {
      segments.push({ lead, cards });
      index += 1;
    }
  }
  return segments;
}

function EntryRow({
  row,
  categories,
  ordered,
  currencies,
  chrome,
  nested,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: BulkEntryRow;
  categories: Category[];
  ordered: Category[];
  currencies: Currency[];
  chrome?: boolean;
  nested?: boolean;
  onUpdate: (id: string, field: keyof BulkEntryRow, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const selected = categories.find((category) => category.id === row.categoryId);
  const card = isCreditCard(selected);
  const bank = parentBank(selected, categories);
  const accountCurrency = defaultCurrencyFor(selected, categories);
  const overridden = Boolean(selected) && row.currencyCode !== accountCurrency;
  const symbol = currencySymbol(row.currencyCode).trim();

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_96px] gap-2 sm:h-9 sm:grid-cols-[1fr_150px_104px_1fr_36px] sm:items-center sm:gap-2",
        chrome && "rounded-lg bg-muted/30 p-3 sm:rounded-none sm:bg-transparent sm:p-0 sm:h-9"
      )}
    >
      <div className={cn("relative col-span-2 min-w-0 sm:col-span-1", nested && "sm:pl-5")}>
        {nested && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 hidden h-px w-5 -translate-y-1/2 bg-foreground/30 sm:block"
          />
        )}
        <Select value={row.categoryId} onValueChange={(value) => onUpdate(row.id, "categoryId", value)}>
          <SelectTrigger
            className="h-9 text-sm"
            title={bank ? `Linked to ${bank.name}` : undefined}
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {ordered.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-1.5">
                  {isCreditCard(cat) && (
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold",
            card ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {card ? `−${symbol}` : symbol}
        </span>
        <Input
          type="number"
          inputMode="decimal"
          value={row.amount}
          onChange={(event) => onUpdate(row.id, "amount", event.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className={cn("h-9 text-sm tabular-nums", symbol.length > 2 ? "pl-12" : "pl-9")}
          aria-label={card ? `Balance owed for ${selected?.name}` : `Amount for ${selected?.name ?? "category"}`}
        />
      </div>

      <Select
        value={row.currencyCode}
        onValueChange={(value) => onUpdate(row.id, "currencyCode", value)}
      >
        <SelectTrigger
          className={cn(
            "h-9 text-sm font-medium",
            overridden && "border-amber-500 ring-1 ring-amber-500/40 text-amber-700 dark:text-amber-300"
          )}
          title={overridden ? `${selected?.name} is usually ${accountCurrency}` : undefined}
          aria-label="Currency"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-1.5">
                <span aria-hidden>{regionFor(currency.code).flag}</span>
                {currency.code}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={row.notes}
        onChange={(event) => onUpdate(row.id, "notes", event.target.value)}
        placeholder="Notes (optional)"
        className="h-9 text-sm"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(row.id)}
        disabled={!canRemove}
        className="h-9 w-9 justify-self-end text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
        title="Remove row"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

type Segment = ReturnType<typeof segmentRows>[number];

/** Consecutive segments whose bank shares a currency form one region section. */
function regionSectionsOf(segments: Segment[], categories: Category[]) {
  const sections: { key: string; currency: string; segments: Segment[]; rows: BulkEntryRow[] }[] = [];
  for (const segment of segments) {
    const lead = categories.find((category) => category.id === segment.lead.categoryId);
    const currency = defaultCurrencyFor(lead, categories);
    const last = sections[sections.length - 1];
    const target =
      last && last.currency === currency
        ? last
        : (sections[sections.push({ key: `${currency}-${segment.lead.id}`, currency, segments: [], rows: [] }) - 1]);
    target.segments.push(segment);
    target.rows.push(segment.lead, ...segment.cards);
  }
  return sections;
}

/** Live total of what you've typed in this region, in the region's currency (cards subtract). */
function RegionSubtotal({
  rows,
  categories,
  currency,
}: {
  rows: BulkEntryRow[];
  categories: Category[];
  currency: string;
}) {
  let total = 0;
  let filled = 0;
  for (const row of rows) {
    const amount = parseFloat(row.amount);
    if (Number.isNaN(amount) || row.currencyCode !== currency) continue;
    const category = categories.find((item) => item.id === row.categoryId);
    total += isCreditCard(category) ? -amount : amount;
    filled += 1;
  }
  if (filled === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-sm font-semibold tabular-nums">{formatCurrency(total, currency)}</span>
  );
}

const BulkEntryForm = ({
  categories,
  currencies,
  onSubmit,
}: BulkEntryFormProps) => {
  const ordered = regionOrdered(categories);
  const defaultCat = ordered[0]?.id || "";
  const defaultCur = defaultCurrencyFor(ordered[0], categories);

  const [date, setDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<BulkEntryRow[]>(() =>
    ordered.length > 0 ? rowsFor(categories) : [createEmptyRow(defaultCat, defaultCur)]
  );
  const [isLoading, setIsLoading] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (categories.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setRows(rowsFor(categories));
    }
  }, [categories]);

  const updateRow = (id: string, field: keyof BulkEntryRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field !== "categoryId") return { ...r, [field]: value };
        // Switching account resets the currency to that account's default.
        const category = categories.find((item) => item.id === value);
        return { ...r, categoryId: value, currencyCode: defaultCurrencyFor(category, categories) };
      })
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
      setRows(
        categories.length > 0 ? rowsFor(categories) : [createEmptyRow(defaultCat, defaultCur)]
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
          Record snapshot
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
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

          <div className="hidden sm:grid sm:grid-cols-[1fr_150px_104px_1fr_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Account</span>
            <span>Amount</span>
            <span>Currency</span>
            <span>Notes</span>
            <span></span>
          </div>

          <div className="space-y-6">
            {regionSectionsOf(segmentRows(rows, categories), categories).map((section) => (
              <section key={section.key} className="space-y-2">
                <RegionHeading currency={section.currency} className="border-b pb-2">
                  <RegionSubtotal rows={section.rows} categories={categories} currency={section.currency} />
                </RegionHeading>
                <div className="space-y-2">
            {section.segments.map((segment) => {
              const grouped = segment.cards.length > 0;
              return (
                <div
                  key={segment.lead.id}
                  className={cn(
                    "relative",
                    grouped && "rounded-lg bg-muted/30 p-3 sm:rounded-none sm:bg-transparent sm:p-0"
                  )}
                >
                  <EntryRow
                    row={segment.lead}
                    categories={categories}
                    ordered={ordered}
                    currencies={currencies}
                    chrome={!grouped}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    canRemove={rows.length > 1}
                  />
                  {grouped && (
                    <>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-9 z-10 hidden w-px bg-foreground/30 sm:block"
                        style={{ height: `calc(${segment.cards.length} * 2.75rem - 1.125rem)` }}
                      />
                      <div className="relative mt-3 space-y-3 border-l border-foreground/30 pl-3 sm:mt-2 sm:space-y-2 sm:border-l-0 sm:pl-0">
                        {segment.cards.map((cardRow) => (
                          <EntryRow
                            key={cardRow.id}
                            row={cardRow}
                            categories={categories}
                            ordered={ordered}
                            currencies={currencies}
                            nested
                            onUpdate={updateRow}
                            onRemove={removeRow}
                            canRemove={rows.length > 1}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
                </div>
              </section>
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
              {isLoading ? "Saving..." : "Save snapshot"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default BulkEntryForm;
