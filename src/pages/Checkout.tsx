import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const isNonEmpty = (v?: string | null) => (v ?? '').toString().trim().length > 0;

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, total } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // New details (when user chooses to enter new ones)
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [telephone, setTelephone] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [mode, setMode] = useState<'saved' | 'new'>('saved');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setSurname(profile.surname ?? '');
      setTelephone(profile.telephone ?? '');
      setCity(profile.city ?? '');
      setStreet(profile.street ?? '');
      setZip(profile.zip ?? '');
    }
  }, [profile]);

  const savedComplete = useMemo(() => {
    const hasName = isNonEmpty(profile?.name) || isNonEmpty(profile?.surname);
    const hasTelephone = isNonEmpty(profile?.telephone);
    const hasAddress =
      isNonEmpty(profile?.city) &&
      isNonEmpty(profile?.street);
    return hasName && hasTelephone && hasAddress;
  }, [profile]);

  useEffect(() => {
    // Default mode based on whether saved details are complete
    setMode(savedComplete ? 'saved' : 'new');
  }, [savedComplete]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;
  if (authLoading || cartLoading) {
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
        !isNonEmpty(name) ||
        !isNonEmpty(surname) ||
        !isNonEmpty(telephone) ||
        !isNonEmpty(city) ||
        !isNonEmpty(street)
      ) {
        alert('Συμπληρώστε όλα τα απαιτούμενα πεδία.');
        return;
      }
    } else if (!savedComplete) {
      alert('Τα αποθηκευμένα στοιχεία είναι ελλιπή. Επιλέξτε "Νέα στοιχεία" ή ενημερώστε τον λογαριασμό σας.');
      return;
    }

    if (!user || items.length === 0) return;

    setLoading(true);

    try {
      // 1) Create order with status 'submitted'
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: user.id,
          total: 0, // Will be calculated by trigger
          status: 'submitted',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2) Use the checkout_order function to process the order
      const { error: checkoutError } = await supabase
        .rpc('checkout_order', { p_order_id: order.id });

      if (checkoutError) throw checkoutError;

      toast({
        title: 'Η παραγγελία ολοκληρώθηκε!',
        description: `Παραγγελία #${order.id} δημιουργήθηκε.`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Αποτυχία ολοκλήρωσης',
        description: error.message || 'Προέκυψε σφάλμα κατά την επεξεργασία της παραγγελίας.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
              <li key={it.variant_id} className="flex justify-between">
                <span>{it.variant.base.name} ({it.variant.variant_name}) × {it.quantity}</span>
                <span>€{(it.variant.price * it.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-3 pt-3 font-medium flex justify-between">
            <span>Σύνολο (χωρίς ΦΠΑ):</span>
            <span>€{total.toFixed(2)}</span>
          </div>
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
              <div><span className="font-medium">Ονοματεπώνυμο:</span> {profile?.name} {profile?.surname}</div>
              <div><span className="font-medium">Τηλέφωνο:</span> {profile?.telephone}</div>
              <div>
                <span className="font-medium">Διεύθυνση:</span>{' '}
                {profile?.street}, {profile?.city} {profile?.zip}
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
                  <Label htmlFor="name">Όνομα</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="surname">Επώνυμο</Label>
                  <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="telephone">Τηλέφωνο</Label>
                <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">Πόλη</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="street">Οδός & Αριθμός</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="zip">Τ.Κ.</Label>
                  <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <Link to="/cart">
            <Button variant="outline">Πίσω στο Καλάθι</Button>
          </Link>
          <Button type="submit" disabled={cartIsEmpty || loading}>
            {loading ? 'Επεξεργασία...' : 'Ολοκλήρωση Παραγγελίας'}
          </Button>
        </div>
      </form>
    </div>
  );
}