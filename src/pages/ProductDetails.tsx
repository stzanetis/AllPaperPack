import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  vat: number;
  image_url: string;
  stock: number;
  categories: {
    id: string;
    name: string;
    parent: { id: string; name: string } | null;
  } | null;
  tags: string[];
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          vat,
          image_url,
          stock,
          categories:category_id (
            id,
            name,
            parent:parent_id ( id, name )
          ),
          tags
        `)
        .eq('id', id)
        .single();

      if (!error) setProduct(data as Product);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-40" />
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
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
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

          {/* Product Name and Stock */}
          <h1 className="text-2xl md:text-3xl text-gray-800 font-semibold mb-2">{product.name}</h1>
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price + Quantity */}
          <div className="my-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-64 h-16 bg-gray-100/70 rounded-full border flex items-center px-4">
              <span className="flex-1 text-center">
                <h1 className="text-2xl text-primary font-bold">{product.price.toFixed(2)}€</h1>
                <p className="text-sm">ΧΟΝΤΡΙΚΗ</p>
              </span>
              <div className="h-10 border-l border-gray-300 ml-4 mr-3" aria-hidden="true" />
              <span className="flex-1 text-center">
                <h1 className="text-xl text-gray-700 font-bold">
                  {(product.price + (product.price * product.vat * 0.01)).toFixed(2)}€
                </h1>
                <p className="text-sm">ΜΕ ΦΠΑ</p>
              </span>
            </div>

            <div className="flex items-center ml-20 gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="bg-primary text-white rounded-full"
              >
                −
              </Button>
              <Input
                type="number"
                className="w-24 rounded-full text-center"
                value={qty}
                min={1}
                max={product.stock || undefined}
                onChange={(e) => {
                  const v = parseInt(e.target.value || '1', 10);
                  const max = Math.max(1, product.stock || 1);
                  setQty(Number.isNaN(v) ? 1 : Math.min(Math.max(1, v), max));
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.min(product.stock || q + 1, q + 1))}
                disabled={product.stock > 0 ? qty >= product.stock : false}
                className="bg-primary text-white rounded-full"
              >
                +
              </Button>
              <Badge className="h-10" variant={product.stock > 0 ? 'default' : 'destructive'}>
                {product.stock > 0 ? `${product.stock} σε απόθεμα` : 'Χωρίς απόθεμα'}
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            className="w-full text-md rounded-full"
          >
            {adding ? 'Προσθήκη…' : 'Προσθήκη στο Καλάθι'}
          </Button>

          <p className="text-muted-foreground my-8 whitespace-pre-line">
            {product.description}
          </p>

          
        </div>
      </div>
    </div>
  );
}