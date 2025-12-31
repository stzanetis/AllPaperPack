import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  vat: number;
  image_url: string | null;
  stock: number;
  category_name: string | null;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

interface Tag {
  id: number;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialTag = searchParams.get('tag') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);

  // Keep state in sync if URL changes externally (no-op if same)
  useEffect(() => {
    const urlCat = searchParams.get('category') || 'all';
    const urlTag = searchParams.get('tag') || 'all';
    setSelectedCategory(urlCat);
    setSelectedTag(urlTag);
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);

    // Use view_products_flat which has category info joined
    let query = supabase
      .from('view_products_flat')
      .select(`
        product_id,
        product_name,
        description,
        price,
        vat,
        image_url,
        stock,
        category_id,
        category_name,
        parent_category_id
      `);

    // If a parent category is selected, include its subcategories too
    if (selectedCategory !== 'all') {
      const categoryId = parseInt(selectedCategory);
      const childIds = categories
        .filter((c) => c.parent_id === categoryId)
        .map((c) => c.id);

      const includeIds = [categoryId, ...childIds];
      query = query.in('category_id', includeIds);
    }

    let { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
      return;
    }

    // Filter by tag if selected
    if (selectedTag !== 'all') {
      const tagId = parseInt(selectedTag);
      const { data: taggedProducts, error: tagError } = await supabase
        .from('product_discribed_by_tags')
        .select('product_id')
        .eq('tag_id', tagId);

      if (tagError) {
        console.error('Error fetching tagged products:', tagError);
      } else {
        const taggedProductIds = taggedProducts?.map(tp => tp.product_id) || [];
        data = data?.filter(p => taggedProductIds.includes(p.product_id)) || [];
      }
    }

    // Map view columns to component's expected shape
    const mappedProducts: Product[] = (data || []).map(p => ({
      id: p.product_id,
      name: p.product_name,
      description: p.description,
      price: p.price,
      vat: p.vat,
      image_url: p.image_url,
      stock: p.stock,
      category_name: p.category_name
    }));
    setProducts(mappedProducts);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, parent_id')
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
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
    } else {
      setTags(data || []);
    }
  };

  // Fetch categories and tags once
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Fetch products whenever selected category, tag or categories list changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedTag, categories]);

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
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-48">
            <Select
              value={selectedTag}
              onValueChange={(value) => {
                setSelectedTag(value);
                const params = new URLSearchParams(searchParams);
                if (value === 'all') {
                  params.delete('tag');
                } else {
                  params.set('tag', value);
                }
                setSearchParams(params);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες οι Προτάσεις</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={String(tag.id)}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          <div className="col-span-full text-center text-muted-foreground">
            <div className="border-t border-gray-300 my-4" />
            Τέλος προϊόντων.
          </div>
        </div>
      )}
    </div>
  );
}