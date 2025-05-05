import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/lib/types";
import { Pencil, Tag, Trash2 } from "lucide-react"; // Added Tag icon

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
            {" "}
            {/* Increased spacing */}
            {categories
              .filter((category) => category !== undefined)
              .map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-muted/40 border rounded-lg hover:bg-muted/80 transition-colors duration-150" /* Adjusted padding, background, added hover effect */
                >
                  <div className="flex items-center space-x-3">
                    {" "}
                    {/* Added icon container */}
                    <Tag className="h-5 w-5 text-primary" />{" "}
                    {/* Added category icon */}
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>{" "}
                      {/* Increased font weight */}
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {" "}
                          {/* Added margin-top */}
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost" /* Changed variant */
                      size="icon" /* Changed size */
                      onClick={() => onEdit(category)}
                      className="h-8 w-8" /* Adjusted size */
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost" /* Changed variant */
                      size="icon" /* Changed size */
                      onClick={() => onDelete(category)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10" /* Adjusted size and hover */
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryList;
