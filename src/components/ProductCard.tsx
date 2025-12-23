import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  vat: number;
  image_url: string | null;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    await addToCart(product.id, 1);
    setLoading(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <Link to={`/products/${product.id}`}>
          <div className="aspect-square mb-4 overflow-hidden rounded-md bg-muted">
            <img
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>

          <h3 className="font-semibold text-base md:text-lg mb-2 line-clamp-3 md:line-clamp-none">
            {product.name}
          </h3>

          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        </Link>

        {/* Price section pinned to bottom of CardContent */}
        <div className="mt-auto flex items-center md:gap-2 bg-gray-100 py-1 px-3 rounded-md">
          <span className="font-bold text-xl md:text-3xl text-primary mr-2">
            {product.price.toFixed(2)}€
          </span>
          <div className="h-8 border-l border-gray-300 mr-2" aria-hidden="true" />
          <span className="font-bold text-xs md:text-sm text-gray-700">
            <span className="md:text-sm block">Με ΦΠΑ:</span>
            {(product.price + (product.price * product.vat * 0.01)).toFixed(2)}€
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={handleAddToCart}
          disabled={product.stock === 0 || loading}
        >
          {loading ? (
            'Adding...'
          ) : (
            <>
              <span className="md:hidden">Προσθηκη</span>
              <span className="hidden md:inline">Προσθήκη στο Καλάθι</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};