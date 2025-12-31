import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { MapPin, Ticket, Check, X } from 'lucide-react';

interface PickupLocation {
  id: number;
  name: string;
  working_hours: string | null;
  country: string | null;
  city: string | null;
  street: string | null;
  number: string | null;
  zip: string | null;
  package_capacity: number;
  number_of_packages: number;
}

interface Coupon {
  code: string;
  discount: number;
  expiration_date: string | null;
}

const isNonEmpty = (v?: string | null) => (v ?? '').toString().trim().length > 0;

export default function Checkout() {
  const { user, dbUser, dbUserId, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // New details (when user chooses to enter new ones)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [mode, setMode] = useState<'saved' | 'new'>('saved');

  // Delivery mode: 'delivery' or 'pickup'
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
  const [pickupLoading, setPickupLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const savedComplete = useMemo(() => {
    const hasName = isNonEmpty(dbUser?.full_name);
    const hasPhone = isNonEmpty(dbUser?.phone_number);
    const hasAddress =
      isNonEmpty(dbUser?.country) &&
      isNonEmpty(dbUser?.city) &&
      isNonEmpty(dbUser?.street);
    return hasName && hasPhone && hasAddress;
  }, [dbUser]);

  useEffect(() => {
    // Default mode based on whether saved details are complete
    setMode(savedComplete ? 'saved' : 'new');

    // Prefill "new" fields from saved when available
    if (dbUser) {
      setFullName(dbUser.full_name ?? '');
      setPhoneNumber(dbUser.phone_number ?? '');
      setCountry(dbUser.country ?? '');
      setCity(dbUser.city ?? '');
      setStreet(dbUser.street ?? '');
      setZip(dbUser.zip ?? '');
    }
  }, [savedComplete, dbUser]);

  // Fetch pickup locations
  useEffect(() => {
    const fetchPickupLocations = async () => {
      setPickupLoading(true);
      const { data, error } = await supabase
        .from('pickup_locations')
        .select('id, name, working_hours, country, city, street, number, zip, package_capacity, number_of_packages')
        .order('city', { ascending: true });

      if (!error && data) {
        // Only show locations that have capacity
        const availableLocations = data.filter(loc => loc.number_of_packages < loc.package_capacity);
        setPickupLocations(availableLocations);
      }
      setPickupLoading(false);
    };

    fetchPickupLocations();
  }, []);

  // Calculate VAT and final total
  const { subtotal, vatAmount, finalTotal } = useMemo(() => {
    const subtotal = total;
    const vatAmount = items.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      return sum + (itemTotal * item.product.vat / 100);
    }, 0);
    const totalWithVat = subtotal + vatAmount;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalTotal = Math.max(0, totalWithVat - discount);
    return { subtotal, vatAmount, finalTotal };
  }, [total, items, appliedCoupon]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Εισάγετε κωδικό κουπονιού.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      // Use the database function for validation
      const { data, error } = await supabase
        .rpc('validate_coupon_for_user', {
          coupon_code_param: couponCode.trim().toUpperCase(),
          user_email_param: user?.email
        });

      if (error) {
        console.error('Coupon validation error:', error);
        setCouponError('Σφάλμα επικύρωσης κουπονιού.');
        setCouponLoading(false);
        return;
      }

      // RPC returns an array for table-returning functions
      const result = data?.[0];
      if (!result || !result.is_valid) {
        setCouponError(result?.error_message || 'Μη έγκυρος κωδικός κουπονιού.');
        setCouponLoading(false);
        return;
      }

      // Coupon is valid, apply it
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discount: result.discount,
        expiration_date: null
      });

      toast({
        title: 'Κουπόνι εφαρμόστηκε!',
        description: `Έκπτωση ${result.discount.toFixed(2)}€`,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Σφάλμα εφαρμογής κουπονιού.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

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

    // Validate delivery mode
    if (deliveryMode === 'pickup' && !selectedPickupId) {
      alert('Επιλέξτε σημείο παραλαβής.');
      return;
    }

    // Validate "new" fields if mode=new and delivery mode
    if (deliveryMode === 'delivery') {
      if (mode === 'new') {
        if (
          !isNonEmpty(fullName) ||
          !isNonEmpty(phoneNumber) ||
          !isNonEmpty(country) ||
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
    }

    if (!user || !dbUserId || items.length === 0) return;

    setLoading(true);
    try {
      // 1) Create order in orders table (no user_id - that's in user_places_orders)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          total: finalTotal,
          status: 'Καταχωρημένη',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2) Link user to order via user_places_orders
      const { error: linkError } = await supabase
        .from('user_places_orders')
        .insert({
          user_id: dbUserId,
          order_id: order.id,
        });

      if (linkError) throw linkError;

      // 3) Create order items in orders_include_products
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('orders_include_products')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4) Update product stock
      for (const item of items) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (stockError) throw stockError;
      }

      // 5) If coupon applied, link it to order and mark as used by user
      if (appliedCoupon) {
        await supabase
          .from('coupons_applied_to_orders')
          .insert({
            coupon_code: appliedCoupon.code,
            order_id: order.id,
          });

        await supabase
          .from('user_applied_coupons')
          .insert({
            user_id: dbUserId,
            coupon_code: appliedCoupon.code,
          });
      }

      // 6) If pickup location selected, link it to order and update package count
      if (deliveryMode === 'pickup' && selectedPickupId) {
        await supabase
          .from('orders_shipped_to_pickup_locations')
          .insert({
            order_id: order.id,
            pickup_id: selectedPickupId,
          });

        // Increment number_of_packages at the pickup location
        const location = pickupLocations.find(l => l.id === selectedPickupId);
        if (location) {
          await supabase
            .from('pickup_locations')
            .update({ number_of_packages: location.number_of_packages + 1 })
            .eq('id', selectedPickupId);
        }
      }

      // 7) Clear cart
      await clearCart();

      toast({
        title: 'Η παραγγελία ολοκληρώθηκε!',
        description: `Order #${order.id} δημιουργήθηκε.`,
      });

      navigate('/');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Αποτυχία ολοκλήρωσης',
        description: 'Προέκυψε σφάλμα κατά την επεξεργασία της παραγγελίας.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="font-tinos text-4xl text-[#0a3e06] font-semibold">Ολοκλήρωση Παραγγελίας</h1>
      <div className="border-t border-gray-300 my-4 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Cart Summary and Coupon */}
        <div className="space-y-6">
          {cartIsEmpty ? (
            <div className="border rounded-md p-4">
              Το καλάθι είναι άδειο. <Link to="/products" className="text-primary underline">Συνέχεια αγορών</Link>
            </div>
          ) : (
            <>
              <div className="border rounded-md p-4">
                <div className="font-medium mb-2">Σύνοψη καλαθιού</div>
                <ul className="text-sm space-y-1">
                  {items.map((it) => (
                    <li key={it.product_id} className="flex justify-between">
                      <span>{it.product.name} × {it.quantity}</span>
                      <span>{(it.product.price * it.quantity).toFixed(2)}€</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Υποσύνολο:</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ΦΠΑ:</span>
                    <span>{vatAmount.toFixed(2)}€</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Έκπτωση κουπονιού ({appliedCoupon.code}):</span>
                      <span>-{appliedCoupon.discount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Σύνολο:</span>
                    <span>{finalTotal.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="border rounded-md p-4">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Κουπόνι έκπτωσης
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">
                        Κουπόνι <strong>{appliedCoupon.code}</strong> εφαρμόστηκε! Έκπτωση {appliedCoupon.discount.toFixed(2)}€
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Εισάγετε κωδικό κουπονιού"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Έλεγχος...' : 'Εφαρμογή'}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-sm text-destructive mt-2">{couponError}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column - Delivery Options and Form */}
        <div className="space-y-6">
          {/* Delivery Mode Selection */}
          {!cartIsEmpty && (
            <div className="border rounded-md p-4">
              <div className="font-medium mb-3">Τρόπος παραλαβής</div>
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMode"
                    value="delivery"
                    checked={deliveryMode === 'delivery'}
                    onChange={() => {
                      setDeliveryMode('delivery');
                      setSelectedPickupId(null);
                    }}
                  />
                  <span>Αποστολή στη διεύθυνσή μου</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMode"
                    value="pickup"
                    checked={deliveryMode === 'pickup'}
                    onChange={() => setDeliveryMode('pickup')}
                  />
                  <span>Παραλαβή από σημείο</span>
                </label>
              </div>

              {/* Pickup Locations */}
              {deliveryMode === 'pickup' && (
                <div className="space-y-3">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Επιλέξτε σημείο παραλαβής
                  </div>
                  {pickupLoading ? (
                    <p className="text-sm text-muted-foreground">Φόρτωση σημείων...</p>
                  ) : pickupLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμα σημεία παραλαβής αυτή τη στιγμή.</p>
                  ) : (
                    <div className="grid gap-3">
                      {pickupLocations.map((loc) => (
                        <label
                          key={loc.id}
                          className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedPickupId === loc.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pickupLocation"
                            value={loc.id}
                            checked={selectedPickupId === loc.id}
                            onChange={() => setSelectedPickupId(loc.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{loc.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {[loc.street, loc.number, loc.city, loc.zip, loc.country].filter(Boolean).join(', ')}
                            </div>
                            {loc.working_hours && (
                              <div className="text-sm text-muted-foreground">
                                Ώρες λειτουργίας: {loc.working_hours}
                              </div>
                            )}
                            <Badge variant="outline" className="mt-1">
                              {loc.package_capacity - loc.number_of_packages} διαθέσιμες θέσεις
                            </Badge>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Billing Details - only show for delivery mode */}
          {deliveryMode === 'delivery' && noSaved && (
            <div className="border rounded-md p-4 bg-amber-100/50">
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

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {deliveryMode === 'delivery' && (
              <section className="space-y-4">
                <div className="font-medium">Στοιχεία χρέωσης & αποστολής</div>

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
                    <div><span className="font-medium">Ονοματεπώνυμο:</span> {dbUser?.full_name}</div>
                    <div><span className="font-medium">Τηλέφωνο:</span> {dbUser?.phone_number}</div>
                    <div>
                      <span className="font-medium">Διεύθυνση:</span>{' '}
                      {dbUser?.street}, {dbUser?.city}, {dbUser?.country} {dbUser?.zip}
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
                        <Label htmlFor="zip">Τ.Κ.</Label>
                        <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <Button type="submit" disabled={cartIsEmpty || loading}>
              Αποστολή Παραγγελίας
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}