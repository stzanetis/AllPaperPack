import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';

interface ProductVariant {
  id: number;
  variant_name: string;
  price: number;
  stock: number;
}

interface ProductBase {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  vat: number;
  category_id: number;
  categories: { name: string } | null;
  variants: ProductVariant[];
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
  const [products, setProducts] = useState<ProductBase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Category filtering - parent and subcategory
  const initialParentCategory = searchParams.get('category') || 'all';
  const initialSubCategory = searchParams.get('subcategory') || 'all';
  const initialTag = searchParams.get('tag') || 'all';
  
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>(initialParentCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialSubCategory);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);

  // Derived category lists
  const parentCategories = categories.filter((c) => c.parent_id === null);
  const subCategories = selectedParentCategory !== 'all'
    ? categories.filter((c) => c.parent_id === parseInt(selectedParentCategory))
    : [];

  // Keep state in sync if URL changes externally
  useEffect(() => {
    const urlParent = searchParams.get('category') || 'all';
    const urlSub = searchParams.get('subcategory') || 'all';
    const urlTag = searchParams.get('tag') || 'all';
    setSelectedParentCategory(urlParent);
    setSelectedSubCategory(urlSub);
    setSelectedTag(urlTag);
  }, [searchParams]);

  // Reset subcategory when parent changes
  useEffect(() => {
    if (selectedParentCategory === 'all') {
      setSelectedSubCategory('all');
    } else {
      // Check if current subcategory belongs to selected parent
      const validSub = subCategories.find(c => c.id.toString() === selectedSubCategory);
      if (!validSub && selectedSubCategory !== 'all') {
        setSelectedSubCategory('all');
      }
    }
  }, [selectedParentCategory, categories]);

  const fetchProducts = async () => {
    setLoading(true);

    // Determine which category IDs to filter by
    let categoryIds: number[] = [];
    
    if (selectedSubCategory !== 'all') {
      // Specific subcategory selected
      categoryIds = [parseInt(selectedSubCategory)];
    } else if (selectedParentCategory !== 'all') {
      // Parent category selected - include parent and all its children
      const parentId = parseInt(selectedParentCategory);
      const childIds = categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => c.id);
      categoryIds = [parentId, ...childIds];
    }

    // Fetch product bases with category
    let query = supabase
      .from('product_bases')
      .select(`
        id,
        name,
        description,
        image_path,
        vat,
        category_id,
        categories:category_id (name)
      `);

    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    // If filtering by tag
    let baseIdsFromTag: number[] | null = null;
    
    if (selectedTag !== 'all') {
      const { data: tagProducts } = await supabase
        .from('product_has_tags')
        .select('base_id')
        .eq('tag_id', parseInt(selectedTag));
      
      baseIdsFromTag = (tagProducts || []).map(tp => tp.base_id);
      if (baseIdsFromTag.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      query = query.in('id', baseIdsFromTag);
    }

    const { data: basesData, error: basesError } = await query;
    
    if (basesError) {
      console.error('Error fetching products:', basesError);
      setProducts([]);
      setLoading(false);
      return;
    }

    // Fetch all variants for these products
    const baseIds = (basesData || []).map(b => b.id);
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .in('base_id', baseIds.length > 0 ? baseIds : [-1]);

    // Combine data - only include products that have at least one variant in stock
    const productsWithVariants = (basesData || [])
      .map((base) => {
        const variants = (variantsData || []).filter(v => v.base_id === base.id);
        return { ...base, variants };
      })
      .filter(p => p.variants.some(v => v.stock > 0)); // Only show products with stock

    setProducts(productsWithVariants);
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

  // Fetch products whenever selected categories or tag changes
  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [selectedParentCategory, selectedSubCategory, selectedTag, categories]);

  const updateURLParams = (parent: string, sub: string, tag: string) => {
    const params = new URLSearchParams(searchParams);
    if (parent === 'all') {
      params.delete('category');
      params.delete('subcategory');
    } else {
      params.set('category', parent);
      if (sub === 'all') {
        params.delete('subcategory');
      } else {
        params.set('subcategory', sub);
      }
    }
    if (tag === 'all') {
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }
    setSearchParams(params);
  };

  const handleParentCategoryChange = (value: string) => {
    setSelectedParentCategory(value);
    setSelectedSubCategory('all');
    updateURLParams(value, 'all', selectedTag);
  };

  const handleSubCategoryChange = (value: string) => {
    setSelectedSubCategory(value);
    updateURLParams(selectedParentCategory, value, selectedTag);
  };

  const handleTagChange = (value: string) => {
    setSelectedTag(value);
    updateURLParams(selectedParentCategory, selectedSubCategory, value);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        
        <div className="flex flex-col md:flex-row gap-2 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Αναζήτηση προϊόντων..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full"
            />
          </div>
          
          {/* Parent Category Dropdown */}
          <div className="md:w-48">
            <Select
              value={selectedParentCategory}
              onValueChange={handleParentCategoryChange}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Κατηγορία" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-white">
                <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" value="all">Όλες οι Κατηγορίες</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" key={category.id} value={category.id.toString()}>
                  {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory Dropdown - only show if parent is selected and has subcategories */}
          {selectedParentCategory !== 'all' && subCategories.length > 0 && (
            <div className="md:w-48">
              <Select
                value={selectedSubCategory}
                onValueChange={handleSubCategoryChange}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Υποκατηγορία" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-white">
                  <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" value="all">Όλες οι Υποκατηγορίες</SelectItem>
                  {subCategories.map((category) => (
                    <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Dropdown */}
          <div className="md:w-48">
            <Select
              value={selectedTag}
              onValueChange={handleTagChange}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Προτεινόμενα" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-white">
                <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" value="all">Όλα τα Προτεινόμενα</SelectItem>
                {tags.map((tag) => (
                  <SelectItem className="rounded-xl hover:bg-primary focus:bg-primary" key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
          <p className="text-muted-foreground">Δεν βρέθηκαν προϊόντα με αυτά τα κριτήρια.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}