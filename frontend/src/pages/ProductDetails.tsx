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
  unit_price: number;
  box_price: number | null;
  units_per_box: number | null;
  stock: number;
  sku: string | null;
  enabled: boolean;
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
  enabled: boolean;
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
  const [purchaseType, setPurchaseType] = useState<'item' | 'box'>('item');

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
          enabled,
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
        .select('id, variant_name, unit_price, box_price, units_per_box, stock, sku, enabled')
        .eq('base_id', parseInt(id))
        .order('unit_price', { ascending: true });

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

      // Select first available variant by default (enabled and in stock)
      const firstAvailable = variants.find(v => v.enabled && v.stock > 0);
      if (firstAvailable) {
        setSelectedVariantId(firstAvailable.id);
      } else if (variants.length > 0) {
        setSelectedVariantId(variants[0].id);
      }

      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId);

  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.unit_price && !selectedVariant.box_price) {
        setPurchaseType('item');
      } else if (!selectedVariant.unit_price && selectedVariant.box_price) {
        setPurchaseType('box');
      }
    }
  }, [selectedVariant]);
  const price = purchaseType === 'item' 
    ? (selectedVariant?.unit_price || 0) 
    : (selectedVariant?.box_price || selectedVariant?.unit_price || 0);
  const stock = selectedVariant?.stock || 0;

  const handleAdd = async () => {
    if (!selectedVariant || stock === 0) return;
    setAdding(true);
    await addToCart(selectedVariant.id, qty, purchaseType === 'item' ? 'unit' : 'box');
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 aspect-square max-w-md mx-auto w-full">
            <Skeleton className="h-full w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-4 w-32 rounded-3xl" />
            <Skeleton className="h-8 w-3/4 rounded-3xl" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-3xl" />
              <Skeleton className="h-6 w-16 rounded-3xl" />
            </div>
            <Skeleton className="h-10 w-full max-w-md rounded-3xl" />
            <Skeleton className="h-24 w-full max-w-md rounded-3xl" />
            <Skeleton className="h-6 w-24 rounded-3xl" />
            <div className="flex gap-4">
              <Skeleton className="h-11 w-60 rounded-3xl" />
              <Skeleton className="h-11 w-40 rounded-3xl" />
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

  const availableVariants = product.variants.filter(v => v.enabled && v.stock > 0);
  const isAvailable = product.enabled && availableVariants.length > 0;

  return (
    <div className={`container mx-auto px-4 py-10 ${!isAvailable ? 'opacity-80 grayscale pointer-events-none' : ''}`}>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className={`lg:col-span-2 aspect-square max-w-md mx-auto overflow-hidden rounded-lg bg-muted ${stock > 0 ? '' : 'opacity-80 grayscale'}`}>
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
          <h1 className="text-2xl md:text-3xl text-gray-800 font-semibold mb-4">
            {product.name}
            {selectedVariant?.sku && (
              <span className="ml-2 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full align-middle">
                SKU: {selectedVariant.sku}
              </span>
            )}
          </h1>
          
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
              <label className="ml-1 text-md font-medium mb-2 block">Επιλέξτε είδος</label>
              <Select
                value={selectedVariantId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedVariantId(parseInt(value));
                  setQty(1);
                }}
              >
                <SelectTrigger className="w-full h-12 rounded-3xl">
                  <SelectValue placeholder="Επιλέξτε είδος" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {product.variants.map((variant) => (
                  <SelectItem 
                    key={variant.id} 
                    value={variant.id.toString()}
                    disabled={variant.stock === 0}
                    className="rounded-xl flex flex-col items-start"
                  >
                    <span>
                    {variant.variant_name}
                    {variant.stock === 0 && ' (Εξαντλήθηκε)'}
                    </span>
                  </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price and Purchase Section */}
            <div className="mb-6">
            <div className={`grid gap-6 ${selectedVariant?.unit_price && selectedVariant?.box_price ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Price Display */}
              {selectedVariant?.unit_price && (
                <div
                  className={`p-4 rounded-3xl border cursor-pointer transition-colors ${
                    purchaseType === 'item'
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  } ${!selectedVariant?.box_price ? 'max-w-none' : 'max-w-sm'}`}
                  onClick={() => setPurchaseType('item')}
                >
                <div className="flex flex-col items-start gap-2">
                  <span className={`text-sm font-semibold tracking-wide mb-1 ${
                    purchaseType === 'item' ? 'text-primary' : 'text-gray-600'
                  }`}>
                  ΣΥΣΚΕΥΑΣΙΑ
                  </span>
                  <p className={`text-2xl md:text-4xl font-bold ${
                    purchaseType === 'item' ? 'text-primary' : 'text-gray-700'
                  }`}>{selectedVariant.unit_price.toFixed(2)}€</p>
                  <span className="text-md md:text-lg text-muted-foreground">
                  Με ΦΠΑ: <span className={`font-bold ${
                    purchaseType === 'item' ? 'text-gray-700' : 'text-primary'
                  }`}>{(selectedVariant.unit_price + (selectedVariant.unit_price * product.vat * 0.01)).toFixed(2)}€</span>
                  </span>
                </div>
                </div>
              )}

              {/* Price Display for Boxes */}
              {selectedVariant?.box_price && (
                <div
                  className={`p-4 rounded-3xl border cursor-pointer transition-colors ${
                    purchaseType === 'box'
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  } ${!selectedVariant?.unit_price ? 'max-w-none' : 'max-w-sm'}`}
                  onClick={() => setPurchaseType('box')}
                >
                <div className="flex flex-col items-start gap-2">
                    <span className={`text-sm font-semibold tracking-wide mb-1 ${
                    purchaseType === 'box' ? 'text-primary' : 'text-gray-600'
                    }`}>
                    ΚΙΒΩΤΙΟ
                    {selectedVariant.units_per_box && (
                    <span>
                      {' '}({selectedVariant.units_per_box} συσκευασίες)
                    </span>
                    )}
                    </span>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl md:text-4xl font-bold ${
                      purchaseType === 'box' ? 'text-primary' : 'text-gray-700'
                    }`}>
                      {selectedVariant.box_price.toFixed(2)}€
                    </p>
                  </div>
                  <span className="text-md md:text-lg text-muted-foreground">
                  Με ΦΠΑ: <span className={`font-bold ${
                    purchaseType === 'box' ? 'text-gray-700' : 'text-primary'
                  }`}>{(selectedVariant.box_price + (selectedVariant.box_price * product.vat * 0.01)).toFixed(2)}€</span>
                  </span>
                </div>
                </div>
              )}
            </div>
            </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            {/* Add to Cart Button */}
            <Button
              onClick={handleAdd}
              disabled={stock === 0 || adding || !selectedVariant || (purchaseType === 'item' && !selectedVariant?.unit_price) || (purchaseType === 'box' && !selectedVariant?.box_price)}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[240px] rounded-3xl"
            >
              {adding ? 'Προσθήκη…' : purchaseType === 'item' ? 'Προσθήκη Συσκευασίας στο Καλάθι' : 'Προσθήκη Κιβωτίου στο Καλάθι'}
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
            <Badge variant={stock > 0 ? 'default' : 'destructive'} className={`px-3 py-1 ${stock > 0 ? '' : 'bg-red-400'}`}>
              {stock > 0 ? `${stock} σε απόθεμα` : 'Χωρίς απόθεμα'}
            </Badge>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-xl font-semibold mb-3">Περιγραφή</h3>
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