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
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  vat: number;
  image_url: string | null;
  stock: number;
  category_name: string | null;
  category_id: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface ProductManagementProps {
  onStatsUpdate: () => void;
}

export const ProductManagement = ({ onStatsUpdate }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    // Use view_products_flat which has category info
    const { data, error } = await supabase
      .from('view_products_flat')
      .select('product_id, product_name, description, price, vat, image_url, stock, category_id, category_name')
      .order('product_id', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      const mappedProducts: Product[] = (data || []).map(p => ({
        id: p.product_id,
        name: p.product_name,
        description: p.description,
        price: p.price,
        vat: p.vat,
        image_url: p.image_url,
        stock: p.stock,
        category_name: p.category_name,
        category_id: p.category_id
      }));
      setProducts(mappedProducts);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      vat: parseInt(formData.get('vat') as string) || 24,
      image_url: formData.get('image_url') as string,
      stock: parseInt(formData.get('stock') as string),
    };
    const categoryId = parseInt(formData.get('category_id') as string);

    let error;
    if (editingProduct) {
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      error = updateError;

      // Update category relationship if changed
      if (!error && categoryId && categoryId !== editingProduct.category_id) {
        // Remove old category relationship
        await supabase
          .from('products_belong_to_categories')
          .delete()
          .eq('product_id', editingProduct.id);
        
        // Add new category relationship
        await supabase
          .from('products_belong_to_categories')
          .insert({ product_id: editingProduct.id, category_id: categoryId });
      }
    } else {
      // Insert new product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      error = insertError;

      // Add category relationship for new product
      if (!error && newProduct && categoryId) {
        await supabase
          .from('products_belong_to_categories')
          .insert({ product_id: newProduct.id, category_id: categoryId });
      }
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
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
      });
      setDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
      onStatsUpdate();
    }

    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('products')
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Διαχείριση Προϊόντων</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Καινούργιο Προϊόν
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Τιμή (Χονδρική)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingProduct?.price || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat">ΦΠΑ (Ποσοστό)</Label>
                <Input
                  id="vat"
                  name="vat"
                  type="number"
                  required
                  defaultValue={editingProduct?.vat || 24}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Απόθεμα</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  required
                  defaultValue={editingProduct?.stock || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Κατηγορία</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id?.toString() || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Εικόνας</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  defaultValue={editingProduct?.image_url || ''}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : editingProduct ? 'Ενημέρωση' : 'Προσθήκη'}
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
                <TableHead>Εικόνα</TableHead>
                <TableHead>Όνομα</TableHead>
                <TableHead>Κατηγορία</TableHead>
                <TableHead>Τιμή</TableHead>
                <TableHead>ΦΠΑ</TableHead>
                <TableHead>Απόθεμα</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category_name || 'No category'}</TableCell>
                  <TableCell>{product.price.toFixed(2)}€</TableCell>
                  <TableCell>{product.vat}%</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        className="rounded-full hover:bg-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
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