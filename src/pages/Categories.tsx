
import { useState } from 'react';
import CategoryList from '@/components/CategoryList';
import CategoryForm from '@/components/CategoryForm';
import { Category } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CategoriesProps = {
  categories: Category[];
  onAddCategory: (name: string, description: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string, description: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
};

const Categories = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoriesProps) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      await onDeleteCategory(categoryToDelete.id);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleFormSubmit = async (name: string, description: string) => {
    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, name, description);
      setEditingCategory(null);
    } else {
      await onAddCategory(name, description);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Categories</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CategoryForm
            onSubmit={handleFormSubmit}
            initialName={editingCategory?.name || ''}
            initialDescription={editingCategory?.description || ''}
            buttonText={editingCategory ? 'Update Category' : 'Create Category'}
          />
          {editingCategory && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEditingCategory(null)}
                className="text-sm text-primary underline"
              >
                Cancel Editing
              </button>
            </div>
          )}
        </div>

        <div>
          <CategoryList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{categoryToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
