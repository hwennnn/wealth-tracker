import { useEffect, useMemo, useRef, useState } from "react";
import DateField from "@/components/DateField";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currencies } from "@/lib/currencyData";
import { formatCurrency } from "@/lib/currency";
import { dateKey, netPosition, parseDateKey } from "@/lib/netWorth";
import {
  Category,
  CreditCard,
  CreditCardInput,
  CreditCardStatement,
  Entry,
  ExchangeRates,
  StatementInput,
} from "@/lib/types";
import { format } from "date-fns";
import { CreditCard as CreditCardIcon, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type CardsPageProps = {
  categories: Category[];
  latestEntries: Entry[];
  cards: CreditCard[];
  statements: CreditCardStatement[];
  displayCurrency: string;
  exchangeRates: ExchangeRates | null;
  cardsUnavailable?: boolean;
  onAddCard: (input: CreditCardInput) => Promise<void>;
  onUpdateCard: (id: string, input: CreditCardInput) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onAddStatement: (input: StatementInput) => Promise<void>;
  onUpdateStatement: (id: string, input: StatementInput) => Promise<void>;
  onDeleteStatement: (id: string) => Promise<void>;
};

type CardDialogState =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; card: CreditCard }
  | null;

type StatementDialogState =
  | { mode: "create"; card: CreditCard }
  | { mode: "edit"; card: CreditCard; statement: CreditCardStatement }
  | null;

const toIsoDate = (value: Date) => format(value, "yyyy-MM-dd");

const CardsPage = ({
  categories,
  latestEntries,
  cards,
  statements,
  displayCurrency,
  exchangeRates,
  cardsUnavailable,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddStatement,
  onUpdateStatement,
  onDeleteStatement,
}: CardsPageProps) => {
  const [searchParams] = useSearchParams();
  const openedStatementFromUrl = useRef(false);
  const [cardDialog, setCardDialog] = useState<CardDialogState>(null);
  const [statementDialog, setStatementDialog] = useState<StatementDialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "card"; card: CreditCard }
    | { kind: "statement"; statement: CreditCardStatement }
    | null
  >(null);

  useEffect(() => {
    if (openedStatementFromUrl.current) return;
    const flag = searchParams.get("statement");
    if (!flag || cards.length === 0) return;
    const card = flag === "1" ? cards[0] : cards.find((item) => item.id === flag);
    if (!card) return;
    openedStatementFromUrl.current = true;
    setStatementDialog({ mode: "create", card });
  }, [cards, searchParams]);

  const position = useMemo(
    () =>
      netPosition({
        entries: latestEntries,
        cards,
        statements,
        displayCurrency,
        exchangeRates,
        categoryOrder: categories.map((category) => category.id),
      }),
    [latestEntries, cards, statements, displayCurrency, exchangeRates, categories]
  );

  const accountById = new Map(
    position.accounts.map((account) => [account.categoryId, account])
  );

  const defaultCurrencyFor = (categoryId: string) => {
    const entry = latestEntries.find((item) => item.category_id === categoryId);
    return entry?.currency || displayCurrency || "SGD";
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === "card") await onDeleteCard(pendingDelete.card.id);
      else await onDeleteStatement(pendingDelete.statement.id);
      toast.success(pendingDelete.kind === "card" ? "Card deleted" : "Statement deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Credit cards</h2>
        <p className="text-sm text-muted-foreground">
          Attach cards to an account and record each statement. The latest balance
          owed on every card is subtracted from that account&apos;s net worth.
        </p>
      </div>

      {cardsUnavailable && (
        <Alert>
          <CreditCardIcon className="h-4 w-4" />
          <AlertTitle>Credit cards are not in the database yet</AlertTitle>
          <AlertDescription>
            Apply <span className="font-medium">deploy/migrations/002_credit_cards.sql</span> on
            the database, then reload this page. Your existing assets are unchanged.
          </AlertDescription>
        </Alert>
      )}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Create an account category before adding a card.
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => {
          const account = accountById.get(category.id);
          const accountCards = cards.filter((card) => card.category_id === category.id);
          const assets = account?.assets ?? 0;
          const liabilities = account?.liabilities ?? 0;
          const net = assets - liabilities;
          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <CardDescription>
                      {category.description || "Account"}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 self-start"
                    onClick={() =>
                      setCardDialog({ mode: "create", categoryId: category.id })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add card
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Assets</p>
                    <p className="font-semibold tabular-nums mt-0.5">
                      {formatCurrency(assets, displayCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cards</p>
                    <p
                      className={`font-semibold tabular-nums mt-0.5 ${
                        liabilities > 0 ? "text-red-500" : ""
                      }`}
                    >
                      {liabilities > 0
                        ? formatCurrency(-liabilities, displayCurrency)
                        : formatCurrency(0, displayCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net</p>
                    <p className="font-semibold tabular-nums mt-0.5">
                      {formatCurrency(net, displayCurrency)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {accountCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No credit card on this account.
                  </p>
                ) : (
                  accountCards.map((card) => {
                    const cardStatements = statements
                      .filter((statement) => statement.credit_card_id === card.id)
                      .sort((a, b) =>
                        dateKey(b.statement_date).localeCompare(dateKey(a.statement_date))
                      );
                    const outstandingId = account?.cards.find(
                      (item) => item.cardId === card.id
                    )?.statementId;
                    return (
                      <div key={card.id} className="rounded-lg border p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <CreditCardIcon className="h-4 w-4 text-primary flex-shrink-0" />
                              <p className="text-sm font-semibold truncate">{card.name}</p>
                              <Badge variant="secondary">{card.currency}</Badge>
                            </div>
                            {card.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{card.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setCardDialog({ mode: "edit", card })}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit card</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setPendingDelete({ kind: "card", card })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete card</span>
                            </Button>
                          </div>
                        </div>

                        {cardStatements.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No statements yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {cardStatements.map((statement) => {
                              const outstanding = statement.id === outstandingId;
                              return (
                                <li
                                  key={statement.id}
                                  className="flex items-start justify-between gap-2 text-sm"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">
                                        {format(parseDateKey(statement.statement_date), "dd MMM yyyy")}
                                      </span>
                                      {outstanding && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          Outstanding
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {[
                                        statement.period_start &&
                                          `Period from ${format(parseDateKey(statement.period_start), "dd MMM yyyy")}`,
                                        statement.due_date &&
                                          `Due ${format(parseDateKey(statement.due_date), "dd MMM yyyy")}`,
                                        statement.minimum_payment != null &&
                                          `Min ${formatCurrency(statement.minimum_payment, statement.currency)}`,
                                        statement.notes,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="font-semibold tabular-nums text-red-500">
                                      {formatCurrency(-statement.balance_owed, statement.currency)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        setStatementDialog({ mode: "edit", card, statement })
                                      }
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span className="sr-only">Edit statement</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        setPendingDelete({ kind: "statement", statement })
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">Delete statement</span>
                                    </Button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setStatementDialog({ mode: "create", card })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add statement
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <CardFormDialog
        state={cardDialog}
        categories={categories}
        defaultCurrencyFor={defaultCurrencyFor}
        onClose={() => setCardDialog(null)}
        onAddCard={onAddCard}
        onUpdateCard={onUpdateCard}
      />
      <StatementFormDialog
        state={statementDialog}
        onClose={() => setStatementDialog(null)}
        onAddStatement={onAddStatement}
        onUpdateStatement={onUpdateStatement}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "card" ? "Delete this card?" : "Delete this statement?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "card"
                ? `This removes ${pendingDelete.card.name} and every statement on it.`
                : "This removes the statement. Net worth will use the previous statement, if there is one."}
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

function CardFormDialog({
  state,
  categories,
  defaultCurrencyFor,
  onClose,
  onAddCard,
  onUpdateCard,
}: {
  state: CardDialogState;
  categories: Category[];
  defaultCurrencyFor: (categoryId: string) => string;
  onClose: () => void;
  onAddCard: (input: CreditCardInput) => Promise<void>;
  onUpdateCard: (id: string, input: CreditCardInput) => Promise<void>;
}) {
  const open = !!state;
  const editing = state?.mode === "edit" ? state.card : null;
  const initialCategory =
    state?.mode === "edit" ? state.card.category_id : state?.categoryId || categories[0]?.id || "";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        {state && (
          <CardForm
            key={editing?.id ?? `new-${initialCategory}`}
            categories={categories}
            initialCategoryId={initialCategory}
            initialName={editing?.name ?? ""}
            initialCurrency={editing?.currency ?? defaultCurrencyFor(initialCategory)}
            initialNotes={editing?.notes ?? ""}
            title={editing ? "Edit card" : "Add credit card"}
            submitLabel={editing ? "Save card" : "Add card"}
            onCancel={onClose}
            onSubmit={async (input) => {
              if (editing) await onUpdateCard(editing.id, input);
              else await onAddCard(input);
              toast.success(editing ? "Card updated" : "Card added");
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CardForm({
  categories,
  initialCategoryId,
  initialName,
  initialCurrency,
  initialNotes,
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  initialCategoryId: string;
  initialName: string;
  initialCurrency: string;
  initialNotes: string;
  title: string;
  submitLabel: string;
  onSubmit: (input: CreditCardInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!categoryId) {
      toast.error("Choose the account this card belongs to");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a card name");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        category_id: categoryId,
        name: name.trim(),
        currency,
        notes: notes.trim() || null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          The card uses its own currency, the same way an asset entry does.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-account">Account</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="card-account" className="h-9">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-name">Card name</Label>
          <Input
            id="card-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. DBS Altitude"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="card-currency" className="h-9">
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
        <div className="space-y-1.5">
          <Label htmlFor="card-notes">Notes</Label>
          <Textarea
            id="card-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
            rows={2}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

function StatementFormDialog({
  state,
  onClose,
  onAddStatement,
  onUpdateStatement,
}: {
  state: StatementDialogState;
  onClose: () => void;
  onAddStatement: (input: StatementInput) => Promise<void>;
  onUpdateStatement: (id: string, input: StatementInput) => Promise<void>;
}) {
  const editing = state?.mode === "edit" ? state.statement : null;
  return (
    <Dialog open={!!state} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        {state && (
          <StatementForm
            key={editing?.id ?? `new-${state.card.id}`}
            card={state.card}
            statement={editing}
            onCancel={onClose}
            onSubmit={async (input) => {
              if (editing) await onUpdateStatement(editing.id, input);
              else await onAddStatement(input);
              toast.success(editing ? "Statement updated" : "Statement added");
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatementForm({
  card,
  statement,
  onSubmit,
  onCancel,
}: {
  card: CreditCard;
  statement: CreditCardStatement | null;
  onSubmit: (input: StatementInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [statementDate, setStatementDate] = useState<Date | undefined>(
    statement ? parseDateKey(statement.statement_date) : new Date()
  );
  const [periodStart, setPeriodStart] = useState<Date | undefined>(
    statement?.period_start ? parseDateKey(statement.period_start) : undefined
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    statement?.due_date ? parseDateKey(statement.due_date) : undefined
  );
  const [balance, setBalance] = useState(
    statement ? String(statement.balance_owed) : ""
  );
  const [minimum, setMinimum] = useState(
    statement?.minimum_payment != null ? String(statement.minimum_payment) : ""
  );
  const [currency, setCurrency] = useState(statement?.currency || card.currency);
  const [notes, setNotes] = useState(statement?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!statementDate) {
      toast.error("Statement date is required");
      return;
    }
    const owed = Number(balance);
    if (!Number.isFinite(owed) || owed < 0) {
      toast.error("Balance owed must be zero or a positive amount");
      return;
    }
    let minimumPayment: number | null = null;
    if (minimum.trim()) {
      minimumPayment = Number(minimum);
      if (!Number.isFinite(minimumPayment) || minimumPayment < 0) {
        toast.error("Minimum payment must be zero or a positive amount");
        return;
      }
    }
    const statementKey = toIsoDate(statementDate);
    if (periodStart && toIsoDate(periodStart) > statementKey) {
      toast.error("Period start must be on or before the statement date");
      return;
    }
    if (dueDate && toIsoDate(dueDate) < statementKey) {
      toast.error("Due date must be on or after the statement date");
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        credit_card_id: card.id,
        statement_date: statementKey,
        period_start: periodStart ? toIsoDate(periodStart) : null,
        balance_owed: owed,
        due_date: dueDate ? toIsoDate(dueDate) : null,
        minimum_payment: minimumPayment,
        currency,
        notes: notes.trim() || null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the statement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{statement ? "Edit statement" : "Add statement"}</DialogTitle>
        <DialogDescription>
          {card.name} · {currency}. The balance owed is subtracted from this account.
          A newer statement replaces this one; it is not added on top.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          id="statement-date"
          label="Statement date"
          value={statementDate}
          onChange={setStatementDate}
        />
        <DateField
          id="period-start"
          label="Period start"
          value={periodStart}
          onChange={setPeriodStart}
          optional
        />
        <div className="space-y-1.5">
          <Label htmlFor="balance-owed">Balance owed</Label>
          <Input
            id="balance-owed"
            type="number"
            min="0"
            step="0.01"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            placeholder="0.00"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statement-currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="statement-currency" className="h-9">
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
        <DateField
          id="due-date"
          label="Due date"
          value={dueDate}
          onChange={setDueDate}
          optional
        />
        <div className="space-y-1.5">
          <Label htmlFor="minimum-payment">Minimum payment</Label>
          <Input
            id="minimum-payment"
            type="number"
            min="0"
            step="0.01"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            placeholder="Optional"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="statement-notes">Notes</Label>
          <Textarea
            id="statement-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional"
            rows={2}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {statement ? "Save statement" : "Add statement"}
        </Button>
      </DialogFooter>
    </>
  );
}

export default CardsPage;
