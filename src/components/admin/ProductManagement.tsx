import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Package, ChevronRight } from 'lucide-react';

interface ProductVariant {
  id: number;
  base_id: number;
  variant_name: string;
  price: number;
  stock: number;
}

interface Tag {
  id: number;
  name: string;
  color_hex: string | null;
}

interface ProductBase {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  vat: number;
  category_id: number;
  categories: { name: string } | null;
  variants?: ProductVariant[];
  tags?: Tag[];
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

interface ProductManagementProps {
  onStatsUpdate: () => void;
}

export const ProductManagement = ({ onStatsUpdate }: ProductManagementProps) => {
  const [products, setProducts] = useState<ProductBase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductBase | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<ProductBase | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const fetchProducts = async () => {
    // Fetch product bases with category
    const { data: basesData, error: basesError } = await supabase
      .from('product_bases')
      .select(`
        id,
        name,
        description,
        image_path,
        vat,
        category_id,
        categories:category_id (name)
      `)
      .order('id', { ascending: false });

    if (basesError) {
      console.error('Error fetching products:', basesError);
      return;
    }

    // Fetch all variants
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*');

    // Fetch all product tags
    const { data: productTagsData } = await supabase
      .from('product_has_tags')
      .select('base_id, tag_id, tags:tag_id (id, name, color_hex)');

    // Combine data
    const productsWithVariants = (basesData || []).map((base) => {
      const variants = (variantsData || []).filter(v => v.base_id === base.id);
      const tagRelations = (productTagsData || []).filter(pt => pt.base_id === base.id);
      const tags = tagRelations.map(tr => tr.tags as unknown as Tag).filter(Boolean);
      return { ...base, variants, tags };
    });

    setProducts(productsWithVariants);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, color_hex')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
    } else {
      setAllTags(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      vat: parseInt(formData.get('vat') as string) || 24,
      image_path: formData.get('image_path') as string || null,
      category_id: parseInt(formData.get('category_id') as string),
    };

    let error;
    let productId = editingProduct?.id;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('product_bases')
        .update(productData)
        .eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('product_bases')
        .insert(productData)
        .select('id')
        .single();
      error = insertError;
      productId = insertData?.id;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Handle tags
      if (productId) {
        // Remove existing tags
        await supabase
          .from('product_has_tags')
          .delete()
          .eq('base_id', productId);

        // Add selected tags
        if (selectedTagIds.length > 0) {
          const tagInserts = selectedTagIds.map(tagId => ({
            base_id: productId!,
            tag_id: tagId,
          }));
          await supabase.from('product_has_tags').insert(tagInserts);
        }
      }

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
      });
      setDialogOpen(false);
      setEditingProduct(null);
      setSelectedTagIds([]);
      fetchProducts();
      onStatsUpdate();
    }

    setLoading(false);
  };

  const handleVariantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const variantData = {
      base_id: selectedProductForVariant!.id,
      variant_name: formData.get('variant_name') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
    };

    let error;
    if (editingVariant) {
      const { error: updateError } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', editingVariant.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('product_variants')
        .insert(variantData);
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
        description: `Variant ${editingVariant ? 'updated' : 'created'} successfully`,
      });
      setVariantDialogOpen(false);
      setEditingVariant(null);
      setSelectedProductForVariant(null);
      fetchProducts();
      onStatsUpdate();
    }

    setLoading(false);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product and all its variants?')) return;

    const { error } = await supabase
      .from('product_bases')
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
        description: "Product deleted successfully",
      });
      fetchProducts();
      onStatsUpdate();
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    const { error } = await supabase
      .from('product_variants')
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
        description: "Variant deleted successfully",
      });
      fetchProducts();
      onStatsUpdate();
    }
  };

  const handleEditProduct = (product: ProductBase) => {
    setEditingProduct(product);
    setSelectedTagIds(product.tags?.map(t => t.id) || []);
    setDialogOpen(true);
  };

  const handleAddVariant = (product: ProductBase) => {
    setSelectedProductForVariant(product);
    setEditingVariant(null);
    setVariantDialogOpen(true);
  };

  const handleEditVariant = (product: ProductBase, variant: ProductVariant) => {
    setSelectedProductForVariant(product);
    setEditingVariant(variant);
    setVariantDialogOpen(true);
  };

  const toggleExpand = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setSelectedTagIds([]);
    setDialogOpen(false);
  };

  const toggleTagSelection = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Προϊόντων</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="rounded-full hover:bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Νέο Προϊόν
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Επεξεργασία Προϊόντος' : 'Νέο Προϊόν'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="ml-2" htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="rounded-3xl"
                  defaultValue={editingProduct?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-2" htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="rounded-2xl"
                  defaultValue={editingProduct?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-2" htmlFor="vat">ΦΠΑ (%)</Label>
                <Input
                  id="vat"
                  name="vat"
                  type="number"
                  required
                  className="rounded-3xl"
                  defaultValue={editingProduct?.vat || 24}
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-2" htmlFor="category_id">Κατηγορία</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id?.toString() || ''}>
                  <SelectTrigger className="rounded-3xl">
                    <SelectValue placeholder="Επιλέξτε κατηγορία" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {categories.filter(c => !c.parent_id).map((parentCategory) => (
                      <>
                        <SelectItem 
                          className="rounded-xl font-semibold"
                          key={parentCategory.id} 
                          value={parentCategory.id.toString()}
                        >
                          {parentCategory.name}
                        </SelectItem>
                        {categories.filter(c => c.parent_id === parentCategory.id).map((subCategory) => (
                          <SelectItem 
                            className="rounded-xl pl-8 text-muted-foreground"
                            key={subCategory.id} 
                            value={subCategory.id.toString()}
                          >
                            <span className="flex items-center gap-1">
                              <ChevronRight className="h-3 w-3" />
                              {subCategory.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="ml-2" htmlFor="image_path">URL Εικόνας</Label>
                <Input
                  id="image_path"
                  name="image_path"
                  type="url"
                  className="rounded-3xl"
                  defaultValue={editingProduct?.image_path || ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-2" >Ετικέτες</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-3xl">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTagIds.includes(tag.id) && tag.color_hex ? tag.color_hex : undefined,
                        borderColor: tag.color_hex || undefined,
                      }}
                      onClick={() => toggleTagSelection(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <span className="text-sm text-muted-foreground">Δεν υπάρχουν ετικέτες</span>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-3xl" disabled={loading}>
                {loading ? 'Αποθήκευση...' : editingProduct ? 'Ενημέρωση' : 'Προσθήκη'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Variant Dialog */}
        <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? 'Επεξεργασία Παραλλαγής' : 'Νέα Παραλλαγή'}
                {selectedProductForVariant && ` - ${selectedProductForVariant.name}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="variant_name">Όνομα Παραλλαγής</Label>
                <Input
                  id="variant_name"
                  name="variant_name"
                  required
                  placeholder="π.χ. 500ml, Μεγάλο, Κόκκινο"
                  className="rounded-3xl"
                  defaultValue={editingVariant?.variant_name || ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="price">Τιμή (Χονδρική)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  className="rounded-3xl"
                  defaultValue={editingVariant?.price || ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="stock">Απόθεμα</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  required
                  className="rounded-3xl"
                  defaultValue={editingVariant?.stock || 0}
                />
              </div>
              <Button type="submit" className="w-full rounded-3xl" disabled={loading}>
                {loading ? 'Αποθήκευση...' : editingVariant ? 'Ενημέρωση' : 'Προσθήκη'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Εικόνα</TableHead>
                <TableHead>Όνομα</TableHead>
                <TableHead>Κατηγορία</TableHead>
                <TableHead>ΦΠΑ</TableHead>
                <TableHead>Ετικέτες</TableHead>
                <TableHead>Παραλλαγές</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <>
                  <TableRow key={product.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(product.id)}
                        className="rounded-full hover:bg-primary h-8 w-8"
                      >
                        {expandedProducts.has(product.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <img
                        src={product.image_path || '/placeholder.svg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'Χωρίς κατηγορία'}</TableCell>
                    <TableCell>{product.vat}%</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            style={{ backgroundColor: tag.color_hex || undefined }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.variants?.length || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddVariant(product)}
                          className="rounded-full hover:bg-primary"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                          className="rounded-full hover:bg-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive hover:bg-red-400 rounded-full hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedProducts.has(product.id) && (
                    <TableRow key={`${product.id}-variants`}>
                      <TableCell colSpan={8} className="bg-muted/50 p-4">
                        <div className="ml-8">
                          <h4 className="font-medium mb-2">Παραλλαγές</h4>
                          {product.variants && product.variants.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Όνομα</TableHead>
                                  <TableHead>Τιμή</TableHead>
                                  <TableHead>Απόθεμα</TableHead>
                                  <TableHead>Ενέργειες</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {product.variants.map((variant) => (
                                  <TableRow key={variant.id}>
                                    <TableCell>{variant.variant_name}</TableCell>
                                    <TableCell>{variant.price.toFixed(2)}€</TableCell>
                                    <TableCell>
                                      <Badge variant={variant.stock > 0 ? "default" : "destructive"}>
                                        {variant.stock}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditVariant(product, variant)}
                                          className="rounded-full hover:bg-primary"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteVariant(variant.id)}
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
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Δεν υπάρχουν παραλλαγές. Προσθέστε μία για να εμφανιστεί το προϊόν.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};