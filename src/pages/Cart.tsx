import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, vatAmount, total, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigate to checkout
  const handleGoToCheckout = () => {
    if (!user || items.length === 0) return;
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-tinos text-3xl text-[#0a3e06] font-semibold text-center mb-2">Καλάθι</h1>
        <p className="mb-72 text-muted-foreground">Συνδεθείτε για να δείτε το καλάθι σας.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-tinos text-3xl text-[#0a3e06] font-semibold text-center mb-2">Καλάθι</h1>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-tinos text-3xl text-[#0a3e06] font-semibold text-center mb-2">Καλάθι</h1>
        <p className="text-muted-foreground mb-4">Το καλάθι σας είναι άδειο.</p>
        <Button className="mb-52" onClick={() => navigate('/products')}>
          Συνέχεια Αγορών
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-3xl text-[#0a3e06] font-semibold text-center py-4 mb-4">Καλάθι</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variant_id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <img
                    src={item.variant.base.image_path ?? ''}
                    alt={item.variant.base.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.variant.base.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.variant.variant_name}</p>
                    <p className="text-muted-foreground text-sm">
                      €{item.variant.price.toFixed(2)} ανά τεμάχιο
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variant_id, parseInt(e.target.value) || 0)}
                        className="w-14 sm:w-20 text-center h-8 sm:h-10"
                        min="0"
                        max={item.variant.stock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stock}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <p className="font-semibold text-sm sm:text-base">
                        €{(item.variant.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFromCart(item.variant_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Σύνοψη Παραγγελίας</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Μερικό Σύνολο</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>ΦΠΑ</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Σύνολο</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={handleGoToCheckout}
              >
                Μετάβαση στο Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/products')}
              >
                Συνέχεια Αγορών
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}