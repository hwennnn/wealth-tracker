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
import { Category, CategoryKind } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export type CategoryDraft = {
  name: string;
  description: string;
  kind: CategoryKind;
  parentId: string | null;
};

type CategoryFormProps = {
  categories: Category[];
  editingId?: string | null;
  onSubmit: (draft: CategoryDraft) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  initialKind?: CategoryKind;
  initialParentId?: string | null;
  buttonText?: string;
};

const CategoryForm = ({
  categories,
  editingId,
  onSubmit,
  initialName = "",
  initialDescription = "",
  initialKind = "asset",
  initialParentId = null,
  buttonText = "Create Category",
}: CategoryFormProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [parentId, setParentId] = useState<string>(initialParentId || "none");
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
      });
      if (!initialName) {
        setName("");
        setDescription("");
        setKind("asset");
        setParentId("none");
      }
      toast.success(`Category ${initialName ? "updated" : "created"} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>{initialName ? "Edit Category" : "Create New Category"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Savings, Investments"
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
              <Select value={parentId} onValueChange={setParentId}>
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of this category"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : buttonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CategoryForm;
