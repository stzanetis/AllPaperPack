import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

type Address = {
  id: string;
  user_id: string;
  country: string;
  city: string;
  street: string;
  street_number: string;
};

const isNonEmpty = (v?: string | null) => (v ?? '').toString().trim().length > 0;

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, clearCart, total } = useCart();
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // New details (when user chooses to enter new ones)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [mode, setMode] = useState<'saved' | 'new'>('saved');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Try linked address first
        if (profile?.address_id) {
          const { data } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', profile.address_id)
            .single();
          if (data) setAddress(data as Address);
        } else {
          // Fallback: first address owned by user (if schema has user_id)
          const { data } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          if (data) setAddress(data as Address);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, profile?.address_id]);

  const savedComplete = useMemo(() => {
    const hasName = isNonEmpty(profile?.full_name);
    const hasPhone = isNonEmpty(profile?.phone_number);
    const hasAddress =
      isNonEmpty(address?.country) &&
      isNonEmpty(address?.city) &&
      isNonEmpty(address?.street) &&
      isNonEmpty(address?.street_number);
    return hasName && hasPhone && hasAddress;
  }, [profile, address]);

  useEffect(() => {
    // Default mode based on whether saved details are complete
    setMode(savedComplete ? 'saved' : 'new');

    // Prefill "new" fields from saved when available
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhoneNumber(profile.phone_number ?? '');
    }
    if (address) {
      setCountry(address.country ?? '');
      setCity(address.city ?? '');
      setStreet(address.street ?? '');
      setStreetNumber(address.street_number ?? '');
    }
  }, [savedComplete, profile, address]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;
  if (authLoading || cartLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        Φόρτωση…
      </div>
    );
  }

  const cartIsEmpty = items.length === 0;
  const noSaved = !savedComplete;

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();

    // Validate "new" fields if mode=new
    if (mode === 'new') {
      if (
        !isNonEmpty(fullName) ||
        !isNonEmpty(phoneNumber) ||
        !isNonEmpty(country) ||
        !isNonEmpty(city) ||
        !isNonEmpty(street) ||
        !isNonEmpty(streetNumber)
      ) {
        alert('Συμπληρώστε όλα τα απαιτούμενα πεδία.');
        return;
      }
    } else if (!savedComplete) {
      alert('Τα αποθηκευμένα στοιχεία είναι ελλιπή. Επιλέξτε "Νέα στοιχεία" ή ενημερώστε τον λογαριασμό σας.');
      return;
    }

    if (!user || items.length === 0) return;

    try {
      // 1) Create order (use same shape Cart used: user_id, total, status)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2) Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3) Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product_id);

        if (stockError) throw stockError;
      }

      // 4) Clear cart
      await clearCart();

      toast({
        title: 'Η παραγγελία ολοκληρώθηκε!',
        description: `Order #${String(order.id).slice(-8)} δημιουργήθηκε.`,
      });

      navigate('/');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Αποτυχία ολοκλήρωσης',
        description: 'Προέκυψε σφάλμα κατά την επεξεργασία της παραγγελίας.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Ολοκλήρωση Παραγγελίας</h1>

      {cartIsEmpty ? (
        <div className="border rounded-md p-4 mb-8">
          Το καλάθι είναι άδειο. <Link to="/products" className="text-primary underline">Συνέχεια αγορών</Link>
        </div>
      ) : (
        <div className="border rounded-md p-4 mb-8">
          <div className="font-medium mb-2">Σύνοψη καλαθιού</div>
          <ul className="text-sm space-y-1">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.product.name} × {it.quantity}</span>
                <span>€{(it.product.price * it.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {noSaved && (
        <div className="border rounded-md p-4 mb-6 bg-amber-50">
          <div className="font-medium mb-1">Δεν βρέθηκαν πλήρη αποθηκευμένα στοιχεία.</div>
          <p className="text-sm text-muted-foreground">
            Μπορείτε να τα προσθέσετε στη σελίδα λογαριασμού ή να τα συμπληρώσετε παρακάτω.
          </p>
          <div className="mt-3 flex gap-3">
            <Link to="/account">
              <Button variant="outline">Μετάβαση στα Στοιχεία Λογαριασμού</Button>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-8">
        <section className="space-y-4">
          <div className="font-medium">Στοιχεία χρέωσης</div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="saved"
                checked={mode === 'saved'}
                onChange={() => setMode('saved')}
                disabled={!savedComplete}
              />
              <span>Χρήση αποθηκευμένων στοιχείων</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="new"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
              />
              <span>Εισαγωγή νέων στοιχείων</span>
            </label>
          </div>

          {mode === 'saved' && savedComplete && (
            <div className="grid gap-3 text-sm border rounded-md p-4">
              <div><span className="font-medium">Ονοματεπώνυμο:</span> {profile?.full_name}</div>
              <div><span className="font-medium">Τηλέφωνο:</span> {profile?.phone_number}</div>
              <div>
                <span className="font-medium">Διεύθυνση:</span>{' '}
                {address?.street} {address?.street_number}, {address?.city}, {address?.country}
              </div>
              <div className="pt-2">
                <Link to="/account" className="text-primary underline">Επεξεργασία αποθηκευμένων στοιχείων</Link>
              </div>
            </div>
          )}

          {mode === 'new' && (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Ονοματεπώνυμο</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="phone">Τηλέφωνο</Label>
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="country">Χώρα</Label>
                  <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="city">Πόλη</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="street">Οδός</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="streetNumber">Αριθμός</Label>
                  <Input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} required />
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <Link to="/cart">
            <Button variant="outline">Πίσω στο Καλάθι</Button>
          </Link>
          <Button type="submit" disabled={cartIsEmpty}>
            Συνέχεια
          </Button>
        </div>
      </form>
    </div>
  );
}