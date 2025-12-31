import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, total, loading } = useCart();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const navigate = useNavigate();

  // Calculate VAT and totals
  const { subtotal, vatAmount, totalWithVat } = (() => {
    const subtotal = total;
    const vatAmount = items.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      return sum + (itemTotal * item.product.vat / 100);
    }, 0);
    const totalWithVat = subtotal + vatAmount;
    return { subtotal, vatAmount, totalWithVat };
  })();

  // Remove order placement from Cart; just navigate to checkout
  const handleGoToCheckout = () => {
    if (!user || items.length === 0) return;
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-tinos text-4xl text-[#0a3e06] font-semibold text-center mb-2">Καλάθι</h1>
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
        <h1 className="font-tinos text-4xl text-[#0a3e06] font-semibold text-center mb-2">Καλάθι</h1>
        <p className="text-muted-foreground mb-4">Το καλάθι σας είναι άδειο.</p>
        <Button className="mb-52" onClick={() => navigate('/products')}>
          Συνέχεια Αγορών
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="font-tinos text-4xl text-[#0a3e06] font-semibold text-center pt-4">Καλάθι</h1>
      <div className="border-t border-gray-300 my-4 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-muted-foreground">
                      €{item.product.price.toFixed(2)} ανά τεμάχιο
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      min="0"
                      max={item.product.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-destructive hover:bg-red-400 rounded-full hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Σύνολο Παραγγελίας</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Υποσύνολο</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ΦΠΑ</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Σύνολο</span>
                  <span>€{totalWithVat.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={handleGoToCheckout}
              >
                Μετάβαση για Ολοκλήρωση Παραγγελίας
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