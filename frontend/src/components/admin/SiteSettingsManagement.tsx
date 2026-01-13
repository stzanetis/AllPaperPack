import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Image, Save, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface CarouselImage {
  id: number;
  image_path: string;
  alt_text: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const SiteSettingsManagement = () => {
  const [bannerText, setBannerText] = useState('');
  const [originalBannerText, setOriginalBannerText] = useState('');
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);

  // New image form
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const fetchSettings = async () => {
    // Fetch banner text
    const { data: bannerData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'banner_text')
      .single();

    if (bannerData) {
      setBannerText(bannerData.value);
      setOriginalBannerText(bannerData.value);
    }
  };

  const fetchCarouselImages = async () => {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching carousel images:', error);
    } else {
      setCarouselImages(data || []);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCarouselImages();
  }, []);

  const saveBannerText = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'banner_text', value: bannerText, updated_at: new Date().toISOString() });

    if (error) {
      toast({
        title: 'Σφάλμα',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setOriginalBannerText(bannerText);
      toast({
        title: 'Επιτυχία',
        description: 'Το κείμενο banner αποθηκεύτηκε.',
      });
    }

    setLoading(false);
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    setLoading(true);

    let error;
    if (editingImage) {
      // Update existing image
      const { error: updateError } = await supabase
        .from('carousel_images')
        .update({
          image_path: newImageUrl.trim(),
          alt_text: newAltText.trim() || null,
          link_url: newLinkUrl.trim() || null,
        })
        .eq('id', editingImage.id);
      error = updateError;
    } else {
      // Get max display_order
      const maxOrder = carouselImages.length > 0 
        ? Math.max(...carouselImages.map(img => img.display_order)) 
        : 0;

      // Insert new image
      const { error: insertError } = await supabase
        .from('carousel_images')
        .insert({
          image_path: newImageUrl.trim(),
          alt_text: newAltText.trim() || null,
          link_url: newLinkUrl.trim() || null,
          display_order: maxOrder + 1,
          is_active: true,
        });
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Σφάλμα',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Επιτυχία',
        description: editingImage ? 'Η εικόνα ενημερώθηκε.' : 'Η εικόνα προστέθηκε.',
      });
      setNewImageUrl('');
      setNewAltText('');
      setNewLinkUrl('');
      setEditingImage(null);
      setDialogOpen(false);
      fetchCarouselImages();
    }

    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Σφάλμα',
        description: 'Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `carousel_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      toast({
        title: 'Σφάλμα ανεβάσματος',
        description: uploadError.message + ' - Βεβαιωθείτε ότι το bucket "product-images" υπάρχει στο Supabase Storage και είναι public.',
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    setNewImageUrl(publicUrl);
    setUploading(false);
    
    toast({
      title: 'Επιτυχία',
      description: 'Η εικόνα ανέβηκε. Πατήστε "Προσθήκη" για να την αποθηκεύσετε.',
    });
  };

  const toggleImageActive = async (id: number, currentActive: boolean) => {
    const { error } = await supabase
      .from('carousel_images')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Σφάλμα',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      fetchCarouselImages();
    }
  };

  const deleteImage = async (id: number) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εικόνα;')) return;

    const { error } = await supabase
      .from('carousel_images')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Σφάλμα',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Επιτυχία',
        description: 'Η εικόνα διαγράφηκε.',
      });
      fetchCarouselImages();
    }
  };

  const moveImage = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = carouselImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= carouselImages.length) return;

    const current = carouselImages[currentIndex];
    const swap = carouselImages[swapIndex];

    // Swap display_order values
    await supabase
      .from('carousel_images')
      .update({ display_order: swap.display_order })
      .eq('id', current.id);

    await supabase
      .from('carousel_images')
      .update({ display_order: current.display_order })
      .eq('id', swap.id);

    fetchCarouselImages();
  };

  const openEditDialog = (image: CarouselImage) => {
    setEditingImage(image);
    setNewImageUrl(image.image_path);
    setNewAltText(image.alt_text || '');
    setNewLinkUrl(image.link_url || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingImage(null);
    setNewImageUrl('');
    setNewAltText('');
    setNewLinkUrl('');
  };

  const bannerChanged = bannerText !== originalBannerText;

  return (
    <div className="space-y-8">
      {/* Banner Text Settings */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Κείμενο Banner</CardTitle>
          <CardDescription>
            Το κείμενο που εμφανίζεται στο "We Think Green" banner στο header της σελίδας.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="We Think Green 🌱"
              className="flex-1 rounded-full"
            />
            <Button onClick={saveBannerText} disabled={loading || !bannerChanged}
                    className="rounded-full hover:bg-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              Αποθήκευση
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Carousel Images */}
      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Εικόνες Carousel</CardTitle>
            <CardDescription>
              Διαχειριστείτε τις εικόνες που εμφανίζονται στο carousel της αρχικής σελίδας.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Νέα Εικόνα
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingImage ? 'Επεξεργασία Εικόνας' : 'Προσθήκη Εικόνας'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddImage} className="space-y-4">
                <div className="space-y-1">
                  <Label className="ml-2">Ανέβασμα Εικόνας</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="rounded-3xl"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Ανέβασμα...</p>}
                </div>
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="imageUrl">ή URL Εικόνας</Label>
                  <Input
                    id="imageUrl"
                    value={newImageUrl}
                    className="rounded-3xl"
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground ml-2">
                    Συνιστώμενη αναλογία: 28:9 (π.χ. 1920×617 pixels)
                  </p>
                </div>
                {newImageUrl && (
                  <div className="border rounded-md p-2">
                    <img 
                      src={newImageUrl} 
                      alt="Preview" 
                      className="max-h-40 mx-auto object-contain"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="altText">Εναλλακτικό Κείμενο (Alt Text)</Label>
                  <Input
                    id="altText"
                    value={newAltText}
                    className="rounded-3xl"
                    onChange={(e) => setNewAltText(e.target.value)}
                    placeholder="Περιγραφή εικόνας"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="linkUrl">Σύνδεσμος (προαιρετικό)</Label>
                  <Input
                    id="linkUrl"
                    className="rounded-3xl"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="/products ή https://example.com"
                  />
                  <p className="text-xs text-muted-foreground ml-2">Αν οριστεί, η εικόνα θα είναι κλικ και θα ανοίγει αυτόν τον σύνδεσμο</p>
                </div>
                <Button type="submit" className="w-full rounded-3xl" disabled={loading || !newImageUrl}>
                  {editingImage ? 'Ενημέρωση' : 'Προσθήκη'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {carouselImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Δεν υπάρχουν εικόνες. Προσθέστε μία για να ξεκινήσετε.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Σειρά</TableHead>
                  <TableHead className="w-24">Προεπισκόπηση</TableHead>
                  <TableHead>URL / Alt Text / Link</TableHead>
                  <TableHead className="w-24">Ενεργό</TableHead>
                  <TableHead className="w-32">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carouselImages.map((image, index) => (
                  <TableRow key={image.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveImage(image.id, 'up')}
                          disabled={index === 0}
                          className="hover:bg-primary rounded-full w-8 h-8"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveImage(image.id, 'down')}
                          disabled={index === carouselImages.length - 1}
                          className="hover:bg-primary rounded-full w-8 h-8"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={image.image_path}
                        alt={image.alt_text || 'Carousel image'}
                        className="w-20 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-xs">{image.image_path}</div>
                      {image.alt_text && (
                        <div className="text-xs text-muted-foreground">{image.alt_text}</div>
                      )}
                      {image.link_url && (
                        <div className="text-xs text-blue-600 truncate">🔗 {image.link_url}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={image.is_active}
                        onCheckedChange={() => toggleImageActive(image.id, image.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(image)}
                          className="hover:bg-primary rounded-full w-10 h-10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteImage(image.id)}
                          className="text-destructive hover:bg-red-400 rounded-full hover:text-white w-10 h-10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
