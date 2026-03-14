import { useRef, useState } from "react";
import { Category, Entry, ExchangeRates, TimelineEntry } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2, Upload, Save, Loader2 } from "lucide-react";
import { convertAmount, formatCurrency } from "@/lib/currency";
import { parseCSV } from "@/lib/csv";
import { toast } from "sonner";

type EntriesProps = {
  timelineEntries: TimelineEntry[];
  onDeleteEntries: (entryIds: string[]) => Promise<void>;
  onUpdateEntry: (
    entryId: string,
    updates: {
      amount?: number;
      currency?: string;
      category_id?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onImportEntries?: (
    entries: {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[]
  ) => Promise<void>;
  displayCurrency: string;
  categories: Category[];
  exchangeRates: ExchangeRates | null;
};

const Entries = ({
  timelineEntries,
  onDeleteEntries,
  onUpdateEntry,
  onImportEntries,
  displayCurrency,
  categories,
  exchangeRates,
}: EntriesProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimelineEntry | null>(null);

  // Edit state
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  );

  const convertedTotal = (timeline: TimelineEntry) => {
    if (!exchangeRates) return timeline.total_amount;
    return timeline.entries.reduce(
      (sum, e) =>
        sum + convertAmount(e.amount, e.currency, displayCurrency, exchangeRates),
      0
    );
  };

  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      const ids = entryToDelete.entries.map((e) => e.id);
      await onDeleteEntries(ids);
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch {
      toast.error("Failed to delete snapshot");
    }
  };

  const startEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setEditAmount(entry.amount.toString());
    setEditCurrency(entry.currency);
    setEditCategory(entry.category_id);
    setEditNotes(entry.notes || "");
  };

  const saveEdit = async () => {
    if (!editingEntry) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error("Invalid amount");
      return;
    }
    try {
      setIsSaving(true);
      await onUpdateEntry(editingEntry.id, {
        amount: amt,
        currency: editCurrency,
        category_id: editCategory,
        notes: editNotes,
      });
      toast.success("Entry updated");
      setEditingEntry(null);
      // Refresh view dialog if open
      if (selectedEntry) {
        setIsViewDialogOpen(false);
        setTimeout(() => setIsViewDialogOpen(true), 100);
      }
    } catch {
      toast.error("Failed to update entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportEntries) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      toast.error("No valid rows found in CSV");
      return;
    }
    const entries = rows
      .map((row) => {
        const catId = categoryByName.get(row.category.toLowerCase());
        if (!catId) return null;
        return {
          categoryId: catId,
          amount: row.amount,
          currencyCode: row.currency,
          date: new Date(row.date),
          notes: row.notes,
        };
      })
      .filter(Boolean) as {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[];
    if (entries.length === 0) {
      toast.error("No matching categories found.");
      return;
    }
    try {
      await onImportEntries(entries);
      toast.success(`Imported ${entries.length} entries`);
    } catch {
      toast.error("Failed to import entries");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entries</h2>
          <p className="text-sm text-muted-foreground">All your wealth snapshots</p>
        </div>
        <div className="flex items-center gap-2">
          {onImportEntries && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={() => navigate("/new-entry")}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Entry
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No entries recorded yet. Create your first wealth snapshot.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((timeline) => {
            const total = convertedTotal(timeline);
            return (
              <Card key={timeline.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(timeline.date), "dd MMM yyyy")}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-primary tabular-nums">
                      {formatCurrency(total, displayCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeline.entries.length} asset
                      {timeline.entries.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedEntry(timeline);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setEntryToDelete(timeline);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry && format(new Date(selectedEntry.date), "dd MMMM yyyy")}
            </DialogTitle>
            <DialogDescription>Click the edit icon to modify an entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectedEntry?.entries.map((entry) => {
              const converted =
                exchangeRates && entry.currency !== displayCurrency
                  ? convertAmount(entry.amount, entry.currency, displayCurrency, exchangeRates)
                  : entry.amount;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 group/row"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium">
                      {categoryMap.get(entry.category_id) || "Unknown"}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(converted, displayCurrency)}
                      </p>
                      {entry.currency !== displayCurrency && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(entry.amount, entry.currency)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
                      onClick={() => startEdit(entry)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold text-primary tabular-nums">
                {selectedEntry && formatCurrency(convertedTotal(selectedEntry), displayCurrency)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>Update this asset entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SGD">SGD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isSaving} className="gap-1.5">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {entryToDelete?.entries.length} entries from{" "}
              {entryToDelete && format(new Date(entryToDelete.date), "dd MMM yyyy")}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Entries;
