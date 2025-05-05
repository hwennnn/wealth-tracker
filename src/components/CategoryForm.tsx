
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type CategoryFormProps = {
  onSubmit: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  buttonText?: string;
};

const CategoryForm = ({ 
  onSubmit, 
  initialName = '', 
  initialDescription = '', 
  buttonText = 'Create Category' 
}: CategoryFormProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(name, description);
      if (!initialName) {
        setName('');
        setDescription('');
      }
      toast.success(`Category ${initialName ? 'updated' : 'created'} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialName ? 'Edit Category' : 'Create New Category'}</CardTitle>
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
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : buttonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CategoryForm;
