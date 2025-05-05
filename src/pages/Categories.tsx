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
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/types";
import { useState } from "react";

type CategoriesProps = {
  categories: Category[];
  onAddCategory: (name: string, description: string) => Promise<void>;
  onUpdateCategory: (
    id: string,
    name: string,
    description: string
  ) => Promise<void>;
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 bg-gradient-to-b from-gray-50 to-white">
      {" "}
      {/* Added container and padding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        {" "}
        {/* Adjusted alignment and margin */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-0 text-primary">
          Manage Categories
        </h1>{" "}
        {/* Changed heading level and text */}
        {/* Potential place for a global action button if needed */}
      </div>
      {/* Use a more responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-4">
          {" "}
          {/* Explicit column span */}
          <CategoryForm
            onSubmit={handleFormSubmit}
            initialName={editingCategory?.name || ""}
            initialDescription={editingCategory?.description || ""}
            buttonText={editingCategory ? "Update Category" : "Create Category"}
          />
          {editingCategory && (
            <div className="flex justify-end">
              <Button
                variant="link" /* Use link variant for cancel */
                onClick={() => setEditingCategory(null)}
                className="text-sm h-auto p-0 text-muted-foreground hover:text-primary"
              >
                Cancel Editing
              </Button>
            </div>
          )}
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          {" "}
          {/* Explicit column span */}
          <CategoryList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
      </div>
      {/* Placeholder for future visualizations - could be a separate card or section */}
      {/* 
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Category Visualizations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Visualizations coming soon...</p>
          {/* Visualization components would go here */}
      {/* 
        </CardContent>
      </Card>
      */}
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "
              {categoryToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {" "}
              {/* Added hover effect */}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
