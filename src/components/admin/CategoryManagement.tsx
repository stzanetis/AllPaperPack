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
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  parent_name?: string | null;
}

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, parent_id')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    // Map parent names manually since we can't do self-join easily
    const categoriesWithParent = (data || []).map(cat => ({
      ...cat,
      parent_name: cat.parent_id 
        ? data?.find(p => p.id === cat.parent_id)?.name || null
        : null
    }));

    setCategories(categoriesWithParent);
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
      parent_id,
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
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Επιτυχία",
        description: `Η κατηγορία ${editingCategory ? 'ενημερώθηκε' : 'δημιουργήθηκε'} επιτυχώς`,
      });
      setDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    }

    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κατηγορία;')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Επιτυχία",
        description: "Η κατηγορία διαγράφηκε επιτυχώς",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Κατηγοριών</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Καινούργια Κατηγορία
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Επεξεργασία Κατηγορίας' : 'Νέα Κατηγορία'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingCategory?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_id">Γονική Κατηγορία (προαιρετικό)</Label>
                <select
                  id="parent_id"
                  name="parent_id"
                  defaultValue={editingCategory?.parent_id?.toString() ?? ''}
                  className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                >
                  <option value="">— Καμία —</option>
                  {parentOptions(editingCategory?.id).map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Αφήστε κενό για βασική κατηγορία. Επιλέξτε άλλη κατηγορία για να κάνετε αυτήν μια υποκατηγορία.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Αποθήκευση...' : editingCategory ? 'Ενημέρωση' : 'Προσθήκη'}
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
                <TableHead>Γονική Κατηγορία</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || 'Χωρίς περιγραφή'}</TableCell>
                  <TableCell>{category.parent_name ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};