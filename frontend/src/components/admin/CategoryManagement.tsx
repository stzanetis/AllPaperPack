import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  parent?: { id: number; name: string } | null;
}

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,description,parent_id,parent:parent_id(id,name)')
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories((data as any) || []);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const parentRaw = (formData.get('parent_id') as string) || '';
    const parent_id = parentRaw === '' ? null : parseInt(parentRaw, 10);

    const categoryData = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      parent_id: parent_id as number | null,
    };

    let error;
    if (editingCategory) {
      const { error: updateError } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoryData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully`,
      });
      setDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    }

    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setDialogOpen(false);
  };

  const parentOptions = (currentId?: number) =>
    categories.filter(c => c.id !== currentId); // simple self-exclude

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Κατηγοριών</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}
                    className="rounded-full hover:bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Καινούργια Κατηγορία
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Επεξεργασία Κατηγορίας' : 'Καιρνούργια Κατηγορία'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="rounded-3xl"
                  defaultValue={editingCategory?.name || ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="rounded-2xl"
                  defaultValue={editingCategory?.description || ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="parent_id">Προέλευση Κατηγορίας (προεραιτικό)</Label>
                <select
                  id="parent_id"
                  name="parent_id"
                  defaultValue={editingCategory?.parent_id ?? ''}
                  className="w-full border rounded-3xl h-10 px-3 text-sm bg-background"
                >
                  <option value="">— None —</option>
                  {parentOptions(editingCategory?.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs ml-2 text-muted-foreground">
                  Αφήστε κενό για βασική κατηγορία. Επιλέξτε άλλη κατηγορία για να κάνετε αυτήν μια υποκατηγορία.
                </p>
              </div>
              <Button type="submit" className="w-full rounded-3xl" disabled={loading}>
                {loading ? 'Saving...' : editingCategory ? 'Ενημέρωση' : 'Προσθήκη'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Όνομα</TableHead>
                <TableHead>Περιγραφή</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.filter(c => !c.parent_id).map((parentCategory) => (
                <>
                  <TableRow key={parentCategory.id}>
                    <TableCell className="font-semibold">{parentCategory.name}</TableCell>
                    <TableCell>{parentCategory.description || 'Χωρίς περιγραφή'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(parentCategory)}
                          className="rounded-full hover:bg-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(parentCategory.id)}
                          className="text-destructive hover:bg-red-400 rounded-full hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {categories.filter(c => c.parent_id === parentCategory.id).map((subCategory) => (
                    <TableRow key={subCategory.id} className="bg-muted/30">
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1 pl-6">
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          <span>{subCategory.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{subCategory.description || 'Χωρίς περιγραφή'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(subCategory)}
                            className="rounded-full hover:bg-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subCategory.id)}
                            className="text-destructive hover:bg-red-400 rounded-full hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};