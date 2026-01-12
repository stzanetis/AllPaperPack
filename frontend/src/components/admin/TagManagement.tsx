import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  description: string | null;
  color_hex: string | null;
}

export const TagManagement = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
    } else {
      setTags(data || []);
    }
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
      color_hex: (formData.get('color_hex') as string) || null,
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
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
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Ετικετών</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}
                    className="rounded-full hover:bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέα Ετικέτα
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Επεξεργασία Ετικέτας' : 'Νέα Ετικέτα'}
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
                  defaultValue={editingTag?.name || ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="rounded-3xl"
                  defaultValue={editingTag?.description || ''}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="color_hex">Χρώμα</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_hex"
                    name="color_hex"
                    type="color"
                    className="w-16 h-10 p-1 cursor-pointer"
                    defaultValue={editingTag?.color_hex || '#3b82f6'}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    defaultValue={editingTag?.color_hex || ''}
                    className="flex-1 rounded-3xl"
                    onChange={(e) => {
                      const colorInput = document.getElementById('color_hex') as HTMLInputElement;
                      if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        colorInput.value = e.target.value;
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Επιλέξτε χρώμα για την ετικέτα
                </p>
              </div>
              <Button type="submit" className="w-full rounded-3xl" disabled={loading}>
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
                <TableHead>Προεπισκόπηση</TableHead>
                <TableHead>Όνομα</TableHead>
                <TableHead>Περιγραφή</TableHead>
                <TableHead>Χρώμα</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge
                      style={{ backgroundColor: tag.color_hex || undefined }}
                    >
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.description || 'Χωρίς περιγραφή'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tag.color_hex && (
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: tag.color_hex }}
                        />
                      )}
                      <span className="font-mono text-sm">{tag.color_hex || '—'}</span>
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
              {tags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Δεν υπάρχουν ετικέτες. Δημιουργήστε μία για να ξεκινήσετε.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
