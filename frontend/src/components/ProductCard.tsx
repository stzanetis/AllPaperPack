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

  return (
    <Card className="h-full flex flex-col rounded-3xl ">
      <CardContent className="p-2 flex-1 flex flex-col">
        <Link to={`/products/${product.id}`}>
          <div className="aspect-square mb-4 overflow-hidden rounded-2xl bg-muted">
            <img
              src={product.image_path || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>

          <h3 className="font-semibold text-base md:text-lg mb-2 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        </Link>

        {/* Price section pinned to bottom of CardContent */}
        <div className="mt-auto flex items-center md:gap-2 bg-gray-100 py-1 px-3 rounded-b-2xl">
          <div className="flex-1 text-center">
            <span className="font-bold text-2xl md:text-3xl text-primary block">
              {price.toFixed(2)}€
            </span>
          </div>
          <div className="w-px h-10 bg-gray-300" aria-hidden="true" />
          <div className="flex-1 text-center">
            <span className="text-xs font-semibold md:text-sm text-gray-600 block">Με ΦΠΑ:</span>
            <span className="font-bold text-lg md:text-xl text-gray-800">
              {(price + (price * product.vat * 0.01)).toFixed(2)}€
            </span>
          </div>
        </div>
      </CardContent>

      {/*<CardFooter className="p-4 pt-0">
        <Button 
          className="w-full rounded-3xl" 
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
      </CardFooter>*/}

    </Card>
  );
};