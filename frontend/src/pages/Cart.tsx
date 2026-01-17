import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Καλάθι</h1>
      <p className="text-muted-foreground mb-2">Το καλάθι σας είναι άδειο</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />
        <Button className="mb-52 rounded-3xl" onClick={() => navigate('/products')}>
          Συνέχεια Αγορών
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Καλάθι</h1>
      <p className="text-muted-foreground mb-2">Το καλάθι σας περιέχει {items.length} {items.length === 1 ? 'προϊόν' : 'προϊόντα'}</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.variant_id}-${item.sell_mode}`} className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105 border">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex flex-row items-center gap-4 md:flex-1 md:min-w-0">
                    <img
                      src={item.variant.base.image_path ?? ''}
                      alt={item.variant.base.name}
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm md:text-base truncate">{item.variant.base.name}</h3>
                        <Badge variant="outline" className="text-xs md:text-sm">
                          {item.sell_mode === 'unit' ? 'Συσκευασία' : 'Κιβώτιο'}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.variant.variant_name}</p>
                      <p className="text-muted-foreground text-xs md:text-sm">
                        €{item.sell_mode === 'unit' ? item.variant.unit_price.toFixed(2) : (item.variant.box_price || item.variant.unit_price).toFixed(2)} {item.sell_mode === 'unit' ? 'ανά συσκευασία' : 'ανά κιβώτιο'}
                      </p>
                      {item.sell_mode === 'box' && item.variant.units_per_box && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {item.variant.units_per_box} συσκευασίες ανά κιβώτιο
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full"
                        onClick={() => updateQuantity(item.variant_id, item.quantity - 1, item.sell_mode)}
                      >
                        <Minus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variant_id, parseInt(e.target.value) || 0, item.sell_mode)}
                        className="w-14 md:w-20 text-center h-8 md:h-10 rounded-full"
                        min="0"
                        max={item.variant.stock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full"
                        onClick={() => updateQuantity(item.variant_id, item.quantity + 1, item.sell_mode)}
                        disabled={item.quantity >= item.variant.stock}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <p className="font-semibold text-sm md:text-base">
                        €{((item.sell_mode === 'unit' ? item.variant.unit_price : (item.variant.box_price || item.variant.unit_price)) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 hover:bg-red-400 rounded-full group"
                        onClick={() => removeFromCart(item.variant_id, item.sell_mode)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 group-hover:text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105 border">
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Μεταφορικά</span>
                  <span>Κατόπιν Συνενόησης</span>
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
                className="w-full rounded-3xl" 
                onClick={handleGoToCheckout}
              >
                Μετάβαση για Ολοκλήρωση
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-3xl hover:bg-primary/90"
                onClick={() => navigate('/products')}
              >
                Επιστροφή για Συνέχεια Αγορών
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}