import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/lib/types";
import { isCreditCard, orderCategories } from "@/lib/netWorth";
import { cn } from "@/lib/utils";
import { CreditCard, Pencil, Tag, Trash2 } from "lucide-react";

type CategoryListProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

const CategoryList = ({ categories, onEdit, onDelete }: CategoryListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Categories</CardTitle> {/* Changed title */}
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
            {" "}
            {/* Increased padding and centered content */}
            <Tag className="h-12 w-12 mb-4 text-gray-400" /> {/* Added icon */}
            <p>No categories yet.</p>
            <p>Create your first category to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupCategories(categories).map((group) => (
              <div key={group.lead.id} className="space-y-1.5">
                <CategoryRow category={group.lead} categories={categories} onEdit={onEdit} onDelete={onDelete} />
                {group.cards.length > 0 && (
                  <div className="space-y-1.5">
                    {group.cards.map((category, index) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        categories={categories}
                        nested
                        last={index === group.cards.length - 1}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function groupCategories(categories: Category[]) {
  const ordered = orderCategories(categories.filter((category) => category !== undefined));
  const byId = new Map(ordered.map((category) => [category.id, category]));
  const consumed = new Set<string>();
  const groups: { lead: Category; cards: Category[] }[] = [];
  for (const category of ordered) {
    if (consumed.has(category.id)) continue;
    if (!isCreditCard(category)) {
      const cards = ordered.filter(
        (item) => isCreditCard(item) && item.parent_id === category.id && byId.has(item.id)
      );
      cards.forEach((card) => consumed.add(card.id));
      groups.push({ lead: category, cards });
    } else {
      groups.push({ lead: category, cards: [] });
    }
  }
  return groups;
}

function CategoryRow({
  category,
  categories,
  nested,
  last,
  onEdit,
  onDelete,
}: {
  category: Category;
  categories: Category[];
  nested?: boolean;
  last?: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const bank = category.parent_id
    ? categories.find((item) => item.id === category.parent_id)
    : undefined;
  return (
    <div className={cn("relative", nested && "ml-4 pl-3 sm:ml-6")}>
      {nested && (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute left-0 w-px bg-foreground/25",
              last ? "-top-1.5 h-7" : "-top-1.5 -bottom-1.5"
            )}
          />
          <span aria-hidden className="absolute left-0 top-6 h-px w-3 bg-foreground/25" />
        </>
      )}
      <div className="flex items-center justify-between p-4 bg-muted/40 border rounded-lg hover:bg-muted/80 transition-colors duration-150">
        <div className="flex items-center space-x-3 min-w-0">
          {isCreditCard(category) ? (
            <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <Tag className="h-5 w-5 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{category.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {isCreditCard(category)
                ? bank
                  ? `Card · ${bank.name}`
                  : "Credit card"
                : category.description || "Asset"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category)}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CategoryList;
