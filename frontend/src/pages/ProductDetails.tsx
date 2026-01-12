import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductVariant {
  id: number;
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
  categories: {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
  } | null;
  variants: ProductVariant[];
  tags: Tag[];
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);

      // Fetch product base
      const { data: baseData, error: baseError } = await supabase
        .from('product_bases')
        .select(`
          id,
          name,
          description,
          image_path,
          vat,
          category_id,
          categories:category_id (
            id,
            name,
            parent:parent_id ( id, name )
          )
        `)
        .eq('id', parseInt(id))
        .single();

      if (baseError) {
        setLoading(false);
        return;
      }

      // Fetch variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('base_id', parseInt(id))
        .order('price', { ascending: true });

      // Fetch tags
      const { data: tagsData } = await supabase
        .from('product_has_tags')
        .select('tag_id, tags:tag_id (id, name, color_hex)')
        .eq('base_id', parseInt(id));

      const tags = (tagsData || []).map(t => t.tags as unknown as Tag).filter(Boolean);
      const variants = variantsData || [];

      setProduct({
        ...baseData,
        variants,
        tags,
      } as ProductBase);

      // Select first in-stock variant by default
      const firstInStock = variants.find(v => v.stock > 0);
      if (firstInStock) {
        setSelectedVariantId(firstInStock.id);
      } else if (variants.length > 0) {
        setSelectedVariantId(variants[0].id);
      }

      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId);
  const price = selectedVariant?.price || 0;
  const stock = selectedVariant?.stock || 0;

  const handleAdd = async () => {
    if (!selectedVariant || stock === 0) return;
    setAdding(true);
    await addToCart(selectedVariant.id, qty);
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 aspect-square max-w-md mx-auto w-full">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-24 w-full max-w-md" />
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-11 w-60" />
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Το προϊόν δεν βρέθηκε.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2 aspect-square max-w-md mx-auto overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image_path || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="lg:col-span-3">
          {/* Breadcrumb: Category → Subcategory */}
          <div className="mb-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {product.categories?.parent ? (
                <>
                  <Link
                    to={`/products?category=${product.categories.parent.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {product.categories.parent.name}
                  </Link>
                  <span>/</span>
                  <Link
                    to={`/products?category=${product.categories.id}`}
                    className="hover:text-primary"
                  >
                    {product.categories.name}
                  </Link>
                </>
              ) : product.categories ? (
                <Link
                  to={`/products?category=${product.categories.id}`}
                  className="font-medium hover:text-primary"
                >
                  {product.categories.name}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Product Name */}
          <h1 className="text-2xl md:text-3xl text-gray-800 font-semibold mb-2">{product.name}</h1>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {product.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="default"
                  style={{ backgroundColor: tag.color_hex || undefined }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Variant Selection */}
          {product.variants.length > 1 && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Επιλέξτε είδος</label>
              <Select
                value={selectedVariantId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedVariantId(parseInt(value));
                  setQty(1);
                }}
              >
                <SelectTrigger className="w-full max-w-sm rounded-3xl">
                  <SelectValue placeholder="Επιλέξτε είδος" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {product.variants.map((variant) => (
                    <SelectItem 
                      key={variant.id} 
                      value={variant.id.toString()}
                      disabled={variant.stock === 0}
                      className="rounded-xl"
                    >
                      {variant.variant_name} - {variant.price.toFixed(2)}€
                      {variant.stock === 0 && ' (Εξαντλήθηκε)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price and Purchase Section */}
          <div className="mb-6">
            {/* Price Display */}
            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-200 max-w-md">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Χοντρική</p>
                  <p className="text-3xl font-bold text-primary">{price.toFixed(2)}€</p>
                </div>
                <div className="h-12 w-px bg-gray-300" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Με ΦΠΑ</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {(price + (price * product.vat * 0.01)).toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            {/* Add to Cart Button */}
            <Button
              onClick={handleAdd}
              disabled={stock === 0 || adding || !selectedVariant}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[240px] rounded-3xl"
            >
              {adding ? 'Προσθήκη…' : 'Προσθήκη στο Καλάθι'}
            </Button>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Ποσότητα:</label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="h-9 w-9 rounded-full"
              >
                −
              </Button>
              <Input
                type="number"
                className="w-20 h-9 rounded-full text-center"
                value={qty}
                min={1}
                max={stock || undefined}
                onChange={(e) => {
                  const v = parseInt(e.target.value || '1', 10);
                  const max = Math.max(1, stock || 1);
                  setQty(Number.isNaN(v) ? 1 : Math.min(Math.max(1, v), max));
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.min(stock || q + 1, q + 1))}
                disabled={stock > 0 ? qty >= stock : false}
                className="h-9 w-9 rounded-full"
              >
                +
              </Button>
            </div>

            {/* Stock Badge */}
            <Badge variant={stock > 0 ? 'default' : 'destructive'} className="px-3 py-1">
              {stock > 0 ? `${stock} σε απόθεμα` : 'Χωρίς απόθεμα'}
            </Badge>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">Περιγραφή</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}