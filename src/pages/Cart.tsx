import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, total, loading } = useCart();
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
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={item.variant.base.image_path ?? ''}
                    alt={item.variant.base.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.variant.base.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.variant.variant_name}</p>
                    <p className="text-muted-foreground">
                      €{item.variant.price.toFixed(2)} ανά τεμάχιο
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.variant_id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      min="0"
                      max={item.variant.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                      disabled={item.quantity >= item.variant.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      €{(item.variant.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-destructive hover:text-destructive"
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
              <CardTitle>Σύνοψη Παραγγελίας</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Μερικό Σύνολο</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
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