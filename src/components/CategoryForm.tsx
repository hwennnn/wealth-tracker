import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { isCreditCard } from "@/lib/netWorth";
import { currencies } from "@/lib/currencyData";
import { FALLBACK_CURRENCY, regionFor } from "@/lib/regions";
import { Category, CategoryKind } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export type CategoryDraft = {
  name: string;
  description: string;
  kind: CategoryKind;
  parentId: string | null;
  currency: string;
};

type CategoryFormProps = {
  categories: Category[];
  editingId?: string | null;
  onSubmit: (draft: CategoryDraft) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  initialKind?: CategoryKind;
  initialParentId?: string | null;
  initialCurrency?: string | null;
  buttonText?: string;
  onCancel?: () => void;
};

const CategoryForm = ({
  categories,
  editingId,
  onSubmit,
  initialName = "",
  initialDescription = "",
  initialKind = "asset",
  initialParentId = null,
  initialCurrency = null,
  buttonText = "Create Category",
  onCancel,
}: CategoryFormProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [parentId, setParentId] = useState<string>(initialParentId || "none");
  const [currency, setCurrency] = useState<string>(initialCurrency || FALLBACK_CURRENCY);
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(initialCurrency));

  // A new card follows its bank's currency until you pick one yourself.
  const chooseParent = (value: string) => {
    setParentId(value);
    if (currencyTouched) return;
    const bank = categories.find((category) => category.id === value);
    if (bank?.currency) setCurrency(bank.currency);
  };
  const [isLoading, setIsLoading] = useState(false);

  const banks = categories.filter(
    (category) => !isCreditCard(category) && category.id !== editingId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        name,
        description,
        kind,
        parentId: kind === "credit_card" && parentId !== "none" ? parentId : null,
        currency,
      });
      if (!initialName) {
        setName("");
        setDescription("");
        setKind("asset");
        setParentId("none");
        setCurrency(FALLBACK_CURRENCY);
        setCurrencyTouched(false);
      }
      toast.success(`Category ${initialName ? "updated" : "created"} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={initialName ? "border-primary/60 ring-1 ring-primary/30" : undefined}>
      <CardHeader>
        <CardTitle className="text-base">{initialName ? `Edit ${initialName}` : "New account"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., DBS, Chase, IBKR"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kind">Type</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as CategoryKind)}>
              <SelectTrigger id="kind" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="credit_card">Credit card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "credit_card" && (
            <div className="space-y-2">
              <Label htmlFor="linked-bank">Linked bank</Label>
              <Select value={parentId} onValueChange={chooseParent}>
                <SelectTrigger id="linked-bank" className="h-9">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional. The amount you record is the balance owed.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                setCurrencyTouched(true);
              }}
            >
              <SelectTrigger id="currency" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{regionFor(item.code).flag}</span>
                      <span className="font-medium">{item.code}</span>
                      <span className="text-muted-foreground">{item.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New snapshot rows for this account start in {currency}. You can still change a row.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Multiplier account, joint"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : buttonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CategoryForm;
