import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, ChevronUp, ChevronDown, FileText, Upload } from 'lucide-react';
import { useImageUpload } from '@/hooks/use-image-upload';

interface Catalogue {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const emptyForm = { title: '', description: '', file_path: '', is_active: true, display_order: 0 };

export const CatalogueManagement = () => {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Catalogue | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPdf, uploading, progress } = useImageUpload();

  const fetchCatalogues = async () => {
    const { data, error } = await supabase
      .from('catalogues')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({ title: 'Σφάλμα', description: error.message, variant: 'destructive' });
    } else {
      setCatalogues(data || []);
    }
  };

  useEffect(() => { fetchCatalogues(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: catalogues.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (c: Catalogue) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description ?? '',
      file_path: c.file_path,
      is_active: c.is_active,
      display_order: c.display_order,
    });
    setDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadPdf(file);
    if (url) setForm(f => ({ ...f, file_path: url }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Σφάλμα', description: 'Ο τίτλος είναι υποχρεωτικός', variant: 'destructive' });
      return;
    }
    if (!form.file_path) {
      toast({ title: 'Σφάλμα', description: 'Ανεβάστε ένα αρχείο PDF', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      file_path: form.file_path,
      is_active: form.is_active,
      display_order: form.display_order,
      updated_at: now,
    };

    const { error } = editing
      ? await supabase.from('catalogues').update(payload).eq('id', editing.id)
      : await supabase.from('catalogues').insert({ ...payload, created_at: now });

    setSaving(false);

    if (error) {
      toast({ title: 'Σφάλμα', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Επιτυχία', description: editing ? 'Ο κατάλογος ενημερώθηκε' : 'Ο κατάλογος προστέθηκε' });
      setDialogOpen(false);
      fetchCatalogues();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Διαγραφή καταλόγου;')) return;
    const { error } = await supabase.from('catalogues').delete().eq('id', id);
    if (error) {
      toast({ title: 'Σφάλμα', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Επιτυχία', description: 'Ο κατάλογος διαγράφηκε' });
      fetchCatalogues();
    }
  };

  const handleToggleActive = async (c: Catalogue) => {
    const { error } = await supabase
      .from('catalogues')
      .update({ is_active: !c.is_active, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    if (error) {
      toast({ title: 'Σφάλμα', description: error.message, variant: 'destructive' });
    } else {
      fetchCatalogues();
    }
  };

  const moveOrder = async (c: Catalogue, direction: 'up' | 'down') => {
    const sorted = [...catalogues];
    const idx = sorted.findIndex(x => x.id === c.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    const now = new Date().toISOString();

    const [res1, res2] = await Promise.all([
      supabase.from('catalogues').update({ display_order: other.display_order, updated_at: now }).eq('id', c.id),
      supabase.from('catalogues').update({ display_order: c.display_order, updated_at: now }).eq('id', other.id),
    ]);

    if (res1.error || res2.error) {
      const msg = res1.error?.message ?? res2.error?.message;
      toast({ title: 'Σφάλμα', description: msg, variant: 'destructive' });
      return;
    }
    fetchCatalogues();
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Κατάλογοι PDF</CardTitle>
        <Button className="rounded-full" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Νέος Κατάλογος
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Τίτλος</TableHead>
              <TableHead>Περιγραφή</TableHead>
              <TableHead>Ενεργός</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogues.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOrder(c, 'up')}
                          disabled={i === 0}
                          className="hover:bg-primary rounded-full w-8 h-8"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOrder(c, 'down')}
                          disabled={i === catalogues.length - 1}
                          className="hover:bg-primary rounded-full w-8 h-8"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.description ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(c)}
                          className="hover:bg-primary rounded-full w-10 h-10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="text-destructive hover:bg-red-400 rounded-full hover:text-white w-10 h-10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                </TableCell>
              </TableRow>
            ))}
            {catalogues.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Δεν υπάρχουν κατάλογοι.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg w-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editing ? 'Επεξεργασία Καταλόγου' : 'Νέος Κατάλογος'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 w-full min-w-0">
            <div className="space-y-1">
              <Label className="ml-2" htmlFor="cat-title">Τίτλος *</Label>
              <Input
                id="cat-title"
                value={form.title}
                className="rounded-3xl"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="π.χ. Κατάλογος Χαρτικών 2026"
              />
            </div>

            <div className="space-y-1">
              <Label className="ml-2" htmlFor="cat-desc">Περιγραφή</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                className="rounded-2xl"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Σύντομη περιγραφή του καταλόγου..."
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label className="ml-2">Αρχείο PDF *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              {form.file_path ? (
                <div className="flex items-center gap-2 p-3 border rounded-2xl bg-muted/40 overflow-hidden">
                  <a
                    href={form.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
                  >
                    {form.file_path.split('/').pop()}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-3xl shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Αλλαγή
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Κάντε κλικ για να επιλέξετε PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">Μέγιστο μέγεθος: 100MB</p>
                </div>
              )}
              {uploading && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
            <Label htmlFor="cat-order" className="ml-2">Σειρά εμφάνισης</Label>
            <Input
                id="cat-order"
                className="rounded-3xl"
                type="number"
                min={1}
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 1 }))}
            />
            </div>

            <Button className="w-full rounded-3xl" onClick={handleSave} disabled={saving || uploading}>
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
