import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/lib/types";
import { isCreditCard, orderCategories } from "@/lib/netWorth";
import { cn } from "@/lib/utils";
import { compareRegions, defaultCurrencyFor } from "@/lib/regions";
import { CurrencyChip, RegionHeading } from "@/components/CurrencyChip";
import { CreditCard, Landmark, Pencil, Tag, Trash2 } from "lucide-react";

type CategoryListProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

const CategoryList = ({ categories, onEdit, onDelete }: CategoryListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
            <Tag className="h-12 w-12 mb-4 text-muted-foreground/60" />
            <p>No categories yet.</p>
            <p>Create your first category to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {regionSections(categories).map((section) => (
              <section key={section.currency} className="space-y-2">
                <RegionHeading
                  currency={section.currency}
                  count={section.groups.length}
                  className="border-b pb-2"
                />
                <div className="space-y-2">
                  {section.groups.map((group) => (
                    <div key={group.lead.id}>
                      <CategoryRow
                        category={group.lead}
                        categories={categories}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                      {group.cards.length > 0 && (
                        <div className="relative ml-3 mt-1.5 border-l border-foreground/30 sm:ml-5">
                          {group.cards.map((category, index) => (
                            <div
                              key={category.id}
                              className={cn("relative pl-3", index > 0 && "mt-1.5")}
                            >
                              <span
                                aria-hidden
                                className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-foreground/30"
                              />
                              {index === group.cards.length - 1 && (
                                <span aria-hidden className="absolute -left-px top-1/2 bottom-0 w-px bg-card" />
                              )}
                              <CategoryRow
                                category={category}
                                categories={categories}
                                onEdit={onEdit}
                                onDelete={onDelete}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
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

/** Groups (bank + its cards) bucketed by the bank's currency. */
function regionSections(categories: Category[]) {
  const sections = new Map<string, ReturnType<typeof groupCategories>>();
  for (const group of groupCategories(categories)) {
    const currency = defaultCurrencyFor(group.lead, categories);
    const list = sections.get(currency) ?? [];
    list.push(group);
    sections.set(currency, list);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => compareRegions(a, b))
    .map(([currency, groups]) => ({ currency, groups }));
}

function CategoryRow({
  category,
  categories,
  onEdit,
  onDelete,
}: {
  category: Category;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const bank = category.parent_id
    ? categories.find((item) => item.id === category.parent_id && !isCreditCard(item))
    : undefined;
  const currency = defaultCurrencyFor(category, categories);
  const bankCurrency = bank ? defaultCurrencyFor(bank, categories) : null;
  return (
    <div>
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 bg-muted/40 border rounded-lg hover:bg-muted/70 transition-colors duration-150"
        title={bank ? `Linked to ${bank.name}` : undefined}
      >
        <div className="flex items-center space-x-3 min-w-0">
          {isCreditCard(category) ? (
            <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <Landmark className="h-5 w-5 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold truncate">{category.name}</h3>
              {(!bankCurrency || bankCurrency !== currency) && <CurrencyChip currency={currency} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {isCreditCard(category)
                ? bank
                  ? `Card · ${bank.name}`
                  : "Credit card"
                : category.description || "Asset"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(category)}
            className="h-8 w-8"
            title={`Edit ${category.name}`}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(category)}
            className="h-8 w-8 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            title={`Delete ${category.name}`}
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
