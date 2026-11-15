import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { CalendarIcon, CreditCard, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { parseSnapshotStatements, snapshotPreview } from "@/lib/snapshotForm";
import {
  BulkEntryRow,
  Category,
  CreditCard as CreditCardType,
  CreditCardInput,
  Currency,
  ExchangeRates,
  StatementInput,
} from "@/lib/types";
import { toast } from "sonner";

const ROW_GRID =
  "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_100px_minmax(0,1fr)_40px] gap-2 items-center";

type AssetInput = {
  categoryId: string;
  amount: number;
  currencyCode: string;
  date: Date;
  notes: string;
};

type BulkEntryFormProps = {
  categories: Category[];
  currencies: Currency[];
  cards?: CreditCardType[];
  displayCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  onSubmit: (entries: AssetInput[]) => Promise<void>;
  onAddStatements?: (statements: StatementInput[]) => Promise<void>;
  onAddCard?: (input: CreditCardInput) => Promise<void>;
};

type CardDraft = { balance: string; currency?: string };

function createEmptyRow(defaultCategory: string, defaultCurrency: string): BulkEntryRow {
  return {
    id: crypto.randomUUID(),
    categoryId: defaultCategory,
    amount: "",
    currencyCode: defaultCurrency,
    notes: "",
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Failed to save";
}

const BulkEntryForm = ({
  categories,
  currencies,
  cards = [],
  displayCurrency = "SGD",
  exchangeRates = null,
  onSubmit,
  onAddStatements,
  onAddCard,
}: BulkEntryFormProps) => {
  const defaultCat = categories[0]?.id || "";
  const defaultCur = "SGD";

  const [date, setDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<BulkEntryRow[]>(() =>
    categories.length > 0
      ? categories.map((cat) => createEmptyRow(cat.id, defaultCur))
      : [createEmptyRow(defaultCat, defaultCur)]
  );
  const [drafts, setDrafts] = useState<Record<string, CardDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [addCardFor, setAddCardFor] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (categories.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setRows(categories.map((cat) => createEmptyRow(cat.id, defaultCur)));
    }
  }, [categories, defaultCur]);

  const updateRow = (id: string, field: keyof BulkEntryRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const setDraft = (cardId: string, patch: Partial<CardDraft>) => {
    setDrafts((prev) => ({ ...prev, [cardId]: { ...prev[cardId], ...patch } }));
  };

  const resetRows = () => {
    setRows(
      categories.length > 0
        ? categories.map((cat) => createEmptyRow(cat.id, defaultCur))
        : [createEmptyRow(defaultCat, defaultCur)]
    );
    setDrafts({});
  };

  const cardsOnForm = useMemo(() => {
    const categoryIds = new Set(rows.map((row) => row.categoryId));
    return cards.filter((card) => categoryIds.has(card.category_id));
  }, [cards, rows]);

  const preview = useMemo(() => {
    const assets = rows.flatMap((row) => {
      const raw = row.amount.trim();
      if (!raw) return [];
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) return [];
      return [{ amount, currency: row.currencyCode }];
    });
    const parsed = parseSnapshotStatements(
      cardsOnForm.map((card) => ({
        cardId: card.id,
        cardName: card.name,
        balance: drafts[card.id]?.balance ?? "",
        currency: drafts[card.id]?.currency || card.currency,
      }))
    );
    if (parsed.ok === false) return { error: parsed.error, assets: 0, liabilities: 0, net: 0 };
    const totals = snapshotPreview({
      assets,
      statements: parsed.statements,
      displayCurrency,
      exchangeRates,
    });
    return { error: null, ...totals };
  }, [rows, cardsOnForm, drafts, displayCurrency, exchangeRates]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const entries: AssetInput[] = [];
    for (const row of rows) {
      const raw = row.amount.trim();
      if (!raw) continue;
      const amount = Number(raw);
      if (!row.categoryId || !Number.isFinite(amount) || amount < 0) {
        toast.error("Each filled asset amount must be zero or more.");
        return;
      }
      entries.push({
        categoryId: row.categoryId,
        amount,
        currencyCode: row.currencyCode,
        date,
        notes: row.notes,
      });
    }

    const parsed = parseSnapshotStatements(
      cardsOnForm.map((card) => ({
        cardId: card.id,
        cardName: card.name,
        balance: drafts[card.id]?.balance ?? "",
        currency: drafts[card.id]?.currency || card.currency,
      }))
    );
    if (parsed.ok === false) {
      toast.error(parsed.error);
      return;
    }

    if (entries.length === 0 && parsed.statements.length === 0) {
      toast.error("Enter an asset amount or a statement balance.");
      return;
    }
    if (parsed.statements.length > 0 && !onAddStatements) {
      toast.error("Card statements can't be saved from this form.");
      return;
    }

    const statementDate = format(date, "yyyy-MM-dd");
    const statements: StatementInput[] = parsed.statements.map((statement) => ({
      credit_card_id: statement.creditCardId,
      statement_date: statementDate,
      balance_owed: statement.balanceOwed,
      currency: statement.currency,
      notes: null,
    }));

    let statementsSaved = false;
    try {
      setIsLoading(true);
      if (statements.length > 0 && onAddStatements) {
        await onAddStatements(statements);
        statementsSaved = true;
      }
      if (entries.length > 0) {
        await onSubmit(entries);
      }
      const parts = [
        entries.length > 0 ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}` : null,
        statements.length > 0
          ? `${statements.length} ${statements.length === 1 ? "statement" : "statements"}`
          : null,
      ].filter(Boolean);
      toast.success(`Saved ${parts.join(" and ")}`);
      resetRows();
    } catch (error) {
      const message = errorMessage(error);
      if (statementsSaved) {
        setDrafts({});
        toast.error(
          `Card statements were saved, but the asset entries were not: ${message}. Statement fields were cleared. Save again to retry the assets.`
        );
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const seenCategories = new Set<string>();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Record Wealth Snapshot</CardTitle>
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
                  onSelect={(next) => next && setDate(next)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_120px_100px_minmax(0,1fr)_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Category</span>
            <span>Amount</span>
            <span>Currency</span>
            <span>Notes</span>
            <span></span>
          </div>

          <div className="space-y-3 sm:space-y-2">
            {rows.map((row) => {
              const firstForCategory = !seenCategories.has(row.categoryId);
              if (row.categoryId) seenCategories.add(row.categoryId);
              const rowCards = firstForCategory
                ? cards.filter((card) => card.category_id === row.categoryId)
                : [];
              const categoryName =
                categories.find((category) => category.id === row.categoryId)?.name ?? "Account";

              return (
                <div
                  key={row.id}
                  className="space-y-2 rounded-lg bg-muted/30 p-3 sm:rounded-none sm:bg-transparent sm:p-0"
                >
                  <div className={ROW_GRID}>
                    <Select
                      value={row.categoryId}
                      onValueChange={(value) => updateRow(row.id, "categoryId", value)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      value={row.amount}
                      onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="h-9 text-sm tabular-nums"
                      aria-label={`Amount for ${categoryName}`}
                    />

                    <Select
                      value={row.currencyCode}
                      onValueChange={(value) => updateRow(row.id, "currencyCode", value)}
                    >
                      <SelectTrigger className="h-9 text-sm" aria-label={`Currency for ${categoryName}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={row.notes}
                      onChange={(event) => updateRow(row.id, "notes", event.target.value)}
                      placeholder="Notes (optional)"
                      className="h-9 text-sm"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (rows.length <= 1) return;
                        setRows((prev) => prev.filter((item) => item.id !== row.id));
                      }}
                      disabled={rows.length <= 1}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {rowCards.map((card) => {
                    const balance = drafts[card.id]?.balance ?? "";
                    const currency = drafts[card.id]?.currency || card.currency;
                      return (
                        <div
                          key={card.id}
                          className="space-y-2 sm:grid sm:grid-cols-[minmax(0,1fr)_120px_100px_minmax(0,1fr)_40px] sm:gap-2 sm:space-y-0 sm:items-center"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 sm:pl-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">{card.name}</span>
                            <span className="text-[11px] text-muted-foreground sm:hidden">statement</span>
                          </div>
                          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2 sm:contents">
                            <Input
                              type="number"
                              value={balance}
                              onChange={(event) => setDraft(card.id, { balance: event.target.value })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="h-9 text-sm tabular-nums"
                              aria-label={`Statement balance for ${card.name}`}
                            />
                            <Select
                              value={currency}
                              onValueChange={(value) => setDraft(card.id, { currency: value })}
                            >
                              <SelectTrigger className="h-9 text-sm" aria-label={`Currency for ${card.name}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((item) => (
                                  <SelectItem key={item.code} value={item.code}>
                                    {item.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="hidden sm:block text-xs text-muted-foreground truncate">
                            Statement balance
                          </p>
                          <span className="hidden sm:block" />
                        </div>
                      );
                  })}

                  {firstForCategory && rowCards.length === 0 && onAddCard && row.categoryId && (
                    <button
                      type="button"
                      onClick={() => setAddCardFor(row.categoryId)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:pl-2"
                    >
                      <Plus className="h-3 w-3" />
                      Add card
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, createEmptyRow(defaultCat, defaultCur)])}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>

          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="min-w-0">
                <p className="text-muted-foreground">Assets</p>
                <p className="font-semibold tabular-nums mt-0.5 truncate">
                  {formatCurrency(preview.assets, displayCurrency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Cards</p>
                <p
                  className={`font-semibold tabular-nums mt-0.5 truncate ${
                    preview.liabilities > 0 ? "text-red-500" : ""
                  }`}
                >
                  {preview.liabilities > 0
                    ? formatCurrency(-preview.liabilities, displayCurrency)
                    : formatCurrency(0, displayCurrency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Net</p>
                <p className="font-semibold tabular-nums mt-0.5 truncate">
                  {formatCurrency(preview.net, displayCurrency)}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "text-[11px] mt-2",
                preview.error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {preview.error ?? "This snapshot only. A blank statement field is not saved."}
            </p>
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isLoading ? "Saving..." : "Save All Entries"}
            </Button>
          </div>
        </CardContent>
      </form>

      <AddCardDialog
        categoryId={addCardFor}
        categoryName={categories.find((category) => category.id === addCardFor)?.name ?? "Account"}
        currencies={currencies}
        defaultCurrency={
          rows.find((row) => row.categoryId === addCardFor)?.currencyCode || defaultCur
        }
        onClose={() => setAddCardFor(null)}
        onAddCard={onAddCard}
      />
    </Card>
  );
};

function AddCardDialog({
  categoryId,
  categoryName,
  currencies,
  defaultCurrency,
  onClose,
  onAddCard,
}: {
  categoryId: string | null;
  categoryName: string;
  currencies: Currency[];
  defaultCurrency: string;
  onClose: () => void;
  onAddCard?: (input: CreditCardInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryId) {
      setName("");
      setCurrency(defaultCurrency);
    }
  }, [categoryId, defaultCurrency]);

  const save = async () => {
    if (!categoryId || !onAddCard) return;
    if (!name.trim()) {
      toast.error("Enter a card name");
      return;
    }
    try {
      setSaving(true);
      await onAddCard({
        category_id: categoryId,
        name: name.trim(),
        currency,
        notes: null,
      });
      toast.success("Card added");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!categoryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add card</DialogTitle>
          <DialogDescription>
            Attach a card to {categoryName}. You can enter its statement balance on this snapshot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="snapshot-card-name">Card name</Label>
            <Input
              id="snapshot-card-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. DBS Altitude"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snapshot-card-currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="snapshot-card-currency" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code} — {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkEntryForm;
