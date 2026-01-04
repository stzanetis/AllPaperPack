import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

const isNonEmpty = (v?: string | null) => (v ?? '').toString().trim().length > 0;

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, subtotal, vatAmount, total } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Shipping/billing details
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [telephone, setTelephone] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [afmNumber, setAfmNumber] = useState('');
  const [mode, setMode] = useState<'saved' | 'new'>('saved');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setSurname(profile.surname ?? '');
      setTelephone(profile.telephone ?? '');
      setCity(profile.city ?? '');
      setStreet(profile.street ?? '');
      setZip(profile.zip ?? '');
      setCompanyName(profile.company_name ?? '');
      setAfmNumber(profile.afm_number ?? '');
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

    // Validate fields if mode=new
    if (mode === 'new') {
      if (
        !isNonEmpty(name) ||
        !isNonEmpty(surname) ||
        !isNonEmpty(telephone) ||
        !isNonEmpty(city) ||
        !isNonEmpty(street)
      ) {
        toast({
          title: 'Ελλιπή στοιχεία',
          description: 'Συμπληρώστε όλα τα απαιτούμενα πεδία (Όνομα, Επώνυμο, Τηλέφωνο, Πόλη, Οδός).',
          variant: 'destructive',
        });
        return;
      }
    } else if (!savedComplete) {
      toast({
        title: 'Ελλιπή στοιχεία',
        description: 'Τα αποθηκευμένα στοιχεία είναι ελλιπή. Επιλέξτε "Νέα στοιχεία" ή ενημερώστε τον λογαριασμό σας.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || items.length === 0) return;

    setLoading(true);

    try {
      // 1) Create order with status 'submitted' and the correct total (including VAT)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: user.id,
          total: total, // Total including VAT
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
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Ολοκλήρωση Παραγγελίας</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          {cartIsEmpty ? (
            <div className="border rounded-md p-4 mb-8">
              Το καλάθι είναι άδειο. <Link to="/products" className="text-primary underline">Συνέχεια αγορών</Link>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {noSaved && (
                <div className="border rounded-md p-4 bg-amber-50">
                  <div className="font-medium mb-1">Δεν βρέθηκαν πλήρη αποθηκευμένα στοιχεία.</div>
                  <p className="text-sm text-muted-foreground">
                    Συμπληρώστε τα στοιχεία σας παρακάτω ή <Link to="/account" className="text-primary underline">ενημερώστε τον λογαριασμό σας</Link>.
                  </p>
                </div>
              )}

              {/* Mode Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Επιλογή στοιχείων</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="saved"
                        checked={mode === 'saved'}
                        onChange={() => setMode('saved')}
                        disabled={!savedComplete}
                        className="w-4 h-4"
                      />
                      <span className={!savedComplete ? 'text-muted-foreground' : ''}>
                        Χρήση αποθηκευμένων στοιχείων
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="new"
                        checked={mode === 'new'}
                        onChange={() => setMode('new')}
                        className="w-4 h-4"
                      />
                      <span>Εισαγωγή νέων στοιχείων</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Details Display */}
              {mode === 'saved' && savedComplete && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Αποθηκευμένα στοιχεία</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="font-medium">Ονοματεπώνυμο:</span> {profile?.name} {profile?.surname}</div>
                    <div><span className="font-medium">Τηλέφωνο:</span> {profile?.telephone}</div>
                    <div>
                      <span className="font-medium">Διεύθυνση:</span>{' '}
                      {profile?.street}, {profile?.city} {profile?.zip}
                    </div>
                    {(profile?.company_name || profile?.afm_number) && (
                      <>
                        <Separator className="my-2" />
                        {profile?.company_name && (
                          <div><span className="font-medium">Επωνυμία:</span> {profile?.company_name}</div>
                        )}
                        {profile?.afm_number && (
                          <div><span className="font-medium">ΑΦΜ:</span> {profile?.afm_number}</div>
                        )}
                      </>
                    )}
                    <div className="pt-2">
                      <Link to="/account" className="text-primary underline text-sm">Επεξεργασία στοιχείων</Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Details Form */}
              {mode === 'new' && (
                <>
                  {/* Personal Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Προσωπικά στοιχεία</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="name">Όνομα <span className="text-red-500">*</span></Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                          <Label htmlFor="surname">Επώνυμο <span className="text-red-500">*</span></Label>
                          <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="telephone">Τηλέφωνο <span className="text-red-500">*</span></Label>
                        <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required placeholder="+30 ..." />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Διεύθυνση αποστολής</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="street">Οδός & Αριθμός <span className="text-red-500">*</span></Label>
                        <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required placeholder="Παράδειγμα 123" />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="city">Πόλη <span className="text-red-500">*</span></Label>
                          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Αθήνα" />
                        </div>
                        <div>
                          <Label htmlFor="zip">Τ.Κ.</Label>
                          <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing Info (Optional) */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Στοιχεία τιμολόγησης <span className="text-sm font-normal text-muted-foreground">(προαιρετικά)</span></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="companyName">Επωνυμία εταιρείας</Label>
                        <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Επωνυμία εταιρείας" />
                      </div>
                      <div>
                        <Label htmlFor="afmNumber">ΑΦΜ</Label>
                        <Input id="afmNumber" value={afmNumber} onChange={(e) => setAfmNumber(e.target.value)} placeholder="123456789" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link to="/cart">
                  <Button variant="outline" type="button">Πίσω στο Καλάθι</Button>
                </Link>
                <Button type="submit" disabled={cartIsEmpty || loading} className="flex-1 sm:flex-none">
                  {loading ? 'Επεξεργασία...' : 'Ολοκλήρωση Παραγγελίας'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Σύνοψη παραγγελίας</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const itemSubtotal = item.variant.price * item.quantity;
                  const itemVat = itemSubtotal * (item.variant.base.vat / 100);
                  return (
                    <div key={item.variant_id} className="flex gap-3 text-sm">
                      <img
                        src={item.variant.base.image_path ?? ''}
                        alt={item.variant.base.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.variant.base.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {item.variant.variant_name} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">€{(itemSubtotal + itemVat).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">ΦΠΑ {item.variant.base.vat}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Μερικό σύνολο</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ΦΠΑ</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Σύνολο</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}