import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface ProductVariant {
  id: number;
  variant_name: string;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  vat: number;
  variants: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  // Get the cheapest variant that is in stock
  const inStockVariants = product.variants.filter(v => v.stock > 0);
  const cheapestVariant = inStockVariants.length > 0
    ? inStockVariants.reduce((min, v) => v.price < min.price ? v : min, inStockVariants[0])
    : null;

  const price = cheapestVariant?.price || 0;
  const hasStock = inStockVariants.length > 0;
  const hasMultipleVariants = product.variants.length > 1;

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <Link to={`/products/${product.id}`}>
          <div className="aspect-square mb-4 overflow-hidden rounded-md bg-muted">
            <img
              src={product.image_path || '/placeholder.svg'}
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
            {price.toFixed(2)}€
          </span>
          <div className="h-8 border-l border-gray-300 mr-2" aria-hidden="true" />
          <span className="font-bold text-xs md:text-sm text-gray-700">
            <span className="md:text-sm block">Με ΦΠΑ:</span>
            {(price + (price * product.vat * 0.01)).toFixed(2)}€
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          asChild
          disabled={!hasStock}
        >
          <Link to={`/products/${product.id}`}>
            <span className="md:hidden">Επιλογή</span>
            <span className="hidden md:inline">
              {hasStock ? 'Επιλογή Παραλλαγής' : 'Εξαντλήθηκε'}
            </span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};