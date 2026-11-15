import CategoryForm from "@/components/CategoryForm";
import CategoryList from "@/components/CategoryList";
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
import { CategoryDraft } from "@/components/CategoryForm";
import { Category } from "@/lib/types";
import { useState } from "react";

type CategoriesProps = {
  categories: Category[];
  onAddCategory: (draft: CategoryDraft) => Promise<void>;
  onUpdateCategory: (id: string, draft: CategoryDraft) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
};

const Categories = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesProps) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const handleFormSubmit = async (draft: CategoryDraft) => {
    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, draft);
      setEditingCategory(null);
    } else {
      await onAddCategory(draft);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Banks, brokers and credit cards, grouped by currency. A card's amount is the balance owed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-20 lg:self-start">
          <CategoryForm
            key={editingCategory?.id ?? "new"}
            categories={categories}
            editingId={editingCategory?.id}
            onSubmit={handleFormSubmit}
            initialName={editingCategory?.name || ""}
            initialDescription={editingCategory?.description || ""}
            initialKind={editingCategory?.kind === "credit_card" ? "credit_card" : "asset"}
            initialParentId={editingCategory?.parent_id}
            initialCurrency={editingCategory?.currency}
            buttonText={editingCategory ? "Save changes" : "Add account"}
            onCancel={editingCategory ? () => setEditingCategory(null) : undefined}
          />
        </div>

        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onEdit={(cat) => {
              setEditingCategory(cat);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDelete={(cat) => {
              setCategoryToDelete(cat);
              setIsDeleteDialogOpen(true);
            }}
          />
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{categoryToDelete?.name}". This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (categoryToDelete) {
                  await onDeleteCategory(categoryToDelete.id);
                  setIsDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }
              }}
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

export default Categories;
