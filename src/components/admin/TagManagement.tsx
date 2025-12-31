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

interface Tag {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export const TagManagement = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, description, color')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }

    setTags(data || []);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const tagData = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      color: formData.get('color') as string,
    };

    let error;
    if (editingTag) {
      const { error: updateError } = await supabase
        .from('tags')
        .update(tagData)
        .eq('id', editingTag.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('tags')
        .insert(tagData);
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
        description: `Η ετικέτα ${editingTag ? 'ενημερώθηκε' : 'δημιουργήθηκε'} επιτυχώς`,
      });
      setDialogOpen(false);
      setEditingTag(null);
      fetchTags();
    }

    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ετικέτα;')) return;

    const { error } = await supabase
      .from('tags')
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
        description: "Η ετικέτα διαγράφηκε επιτυχώς",
      });
      fetchTags();
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTag(null);
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Ετικετών</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Νέα Ετικέτα
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Επεξεργασία Χαρακτηριστικού' : 'Νέο Χαρακτηριστικό'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingTag?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingTag?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Χρώμα (Hex)</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  required
                  defaultValue={editingTag?.color || '#3b82f6'}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Αποθήκευση...' : editingTag ? 'Ενημέρωση' : 'Προσθήκη'}
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
                <TableHead>Χρώμα</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.description || 'Χωρίς περιγραφή'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-mono">{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tag)}
                        className="rounded-full hover:bg-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tag.id)}
                        className="text-destructive hover:bg-red-400 rounded-full hover:text-white"
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