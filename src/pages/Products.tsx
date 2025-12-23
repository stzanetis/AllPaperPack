import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  vat: number;
  image_url: string;
  stock: number;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null; // <-- add parent_id so we can find children
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Keep state in sync if URL changes externally (no-op if same)
  useEffect(() => {
    const urlCat = searchParams.get('category') || 'all';
    setSelectedCategory(urlCat);
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);

    // Base query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        vat,
        image_url,
        stock,
        categories:category_id (name)
      `)
      .eq('is_active', true);

    // If a parent category is selected, include its subcategories too
    if (selectedCategory !== 'all') {
      const childIds = categories
        .filter((c) => c.parent_id === selectedCategory)
        .map((c) => c.id);

      const includeIds = [selectedCategory, ...childIds];
      query = query.in('category_id', includeIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, parent_id') // <-- fetch parent_id
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  // Fetch categories once
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products whenever selected category or categories list changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, categories]); // <-- depend on categories so children are included once loaded

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Αναζήτηση προϊόντων..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                const params = new URLSearchParams(searchParams);
                if (value === 'all') {
                  params.delete('category');
                } else {
                  params.set('category', value);
                }
                setSearchParams(params);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες οι Κατηγορίες</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}