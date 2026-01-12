import { useEffect, useState, FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Building2, Lock, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  quantity: number;
  unit_price: number;
  vat: number;
  variant: {
    variant_name: string;
    base: {
      name: string;
      image_path: string | null;
    };
  };
}

interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  order_has_variants: OrderItem[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  submitted: { label: 'Υποβλήθηκε', variant: 'secondary' },
  confirmed: { label: 'Επιβεβαιώθηκε', variant: 'default' },
  completed: { label: 'Ολοκληρώθηκε', variant: 'outline' },
  cancelled: { label: 'Ακυρώθηκε', variant: 'destructive' },
};

export default function Account() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [afmNumber, setAfmNumber] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (profile || user) {
      setName(profile?.name ?? '');
      setSurname(profile?.surname ?? '');
      setEmail(user?.email ?? '');
      setTelephone(profile?.telephone ?? '');
      setCompanyName(profile?.company_name ?? '');
      setAfmNumber(profile?.afm_number ?? '');
      setCity(profile?.city ?? '');
      setStreet(profile?.street ?? '');
      setZip(profile?.zip ?? '');
    }
  }, [profile, user]);

  // Fetch order history
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          order_has_variants (
            quantity,
            unit_price,
            vat,
            variant:product_variants (
              variant_name,
              base:product_bases (
                name,
                image_path
              )
            )
          )
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as unknown as Order[]);
      }
      setOrdersLoading(false);
    }
    fetchOrders();
  }, [user]);

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErr(null);
    setMsg(null);

    try {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          name: name || null,
          surname: surname || null,
          telephone: telephone || null,
          company_name: companyName || null,
          afm_number: afmNumber || null,
          city: city || null,
          street: street || null,
          zip: zip || null,
        })
        .eq('id', user.id);
      if (upErr) throw upErr;

      if (email && email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email });
        if (authErr) throw authErr;
        setMsg('Στάλθηκε email επιβεβαίωσης για την αλλαγή email.');
      }

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Οι κωδικοί δεν ταιριάζουν.');
        }
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
        if (passErr) throw passErr;
        setMsg(prev => (prev ? `${prev} Ο κωδικός ενημερώθηκε.` : 'Ο κωδικός ενημερώθηκε.'));
        setNewPassword('');
        setConfirmPassword('');
      }

      if (!newPassword && (email === user.email) && !msg) {
        setMsg('Τα στοιχεία ενημερώθηκαν.');
      }

      await refreshProfile();
    } catch (e: any) {
      setErr(e.message || 'Προέκυψε σφάλμα.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Ο λογαριασμός μου</h1>
      <p className="text-muted-foreground mb-2">Διαχειριστείτε τα στοιχεία σας και δείτε το ιστορικό παραγγελιών</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md rounded-full">
          <TabsTrigger value="profile" className="flex items-center gap-2 rounded-full">
            <User className="h-4 w-4" />
            Στοιχεία
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2 rounded-full">
            <Package className="h-4 w-4" />
            Παραγγελίες
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Personal Info Card */}
              <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Προσωπικά στοιχεία</CardTitle>
                  </div>
                  <CardDescription>Το όνομα και τα στοιχεία επικοινωνίας σας</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="ml-2" htmlFor="name">Όνομα</Label>
                      <Input className="rounded-full" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Όνομα" />
                    </div>
                    <div className="space-y-1">
                      <Label className="ml-2" htmlFor="surname">Επώνυμο</Label>
                      <Input className="rounded-full" id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Επώνυμο" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="email">Email</Label>
                    <Input className="rounded-full" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                    <p className="text-xs text-muted-foreground">Η αλλαγή email απαιτεί επιβεβαίωση</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="telephone">Τηλέφωνο</Label>
                    <Input className="rounded-full" id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+30 ..." />
                  </div>
                </CardContent>
              </Card>

              {/* Address Card */}
              <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Διεύθυνση</CardTitle>
                  </div>
                  <CardDescription>Η διεύθυνση αποστολής των παραγγελιών σας</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="street">Οδός & Αριθμός</Label>
                    <Input className="rounded-full" id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Παράδειγμα 123" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="ml-2" htmlFor="city">Πόλη</Label>
                      <Input className="rounded-full" id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Αθήνα" />
                    </div>
                    <div className="space-y-1">
                      <Label className="ml-2" htmlFor="zip">Τ.Κ.</Label>
                      <Input className="rounded-full" id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Info Card */}
              <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Στοιχεία τιμολόγησης</CardTitle>
                  </div>
                  <CardDescription>Για έκδοση τιμολογίου</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="company">Επωνυμία εταιρείας</Label>
                    <Input className="rounded-full" id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Επωνυμία εταιρείας" />
                  </div>
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="afm">ΑΦΜ</Label>
                    <Input className="rounded-full" id="afm" value={afmNumber} onChange={(e) => setAfmNumber(e.target.value)} placeholder="123456789" minLength={9} maxLength={9} />
                  </div>
                </CardContent>
              </Card>

              {/* Password Card */}
              <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Αλλαγή κωδικού</CardTitle>
                  </div>
                  <CardDescription>Αφήστε κενό αν δεν θέλετε αλλαγή</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="newPassword">Νέος κωδικός</Label>
                    <Input className="rounded-full" id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="confirmPassword">Επιβεβαίωση κωδικού</Label>
                    <Input className="rounded-full" id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages and Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button type="submit" disabled={saving} size="lg" className="rounded-3xl">
              {saving ? 'Αποθήκευση…' : 'Αποθήκευση αλλαγών'}
              </Button>
              <div className="flex flex-col gap-4 flex-1">
              {err && (
                <div className="p-3 text-sm rounded-3xl text-red-600 bg-red-50 border border-red-200">
                {err}
                </div>
              )}
              {msg && (
                <div className="p-3 text-sm rounded-3xl text-green-600 bg-green-50 border border-green-200">
                {msg}
                </div>
              )}
              </div>
            </div>
          </form>
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="orders">
          <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Δεν έχετε παραγγελίες</h3>
                  <p className="text-muted-foreground mb-4">Ξεκινήστε τις αγορές σας τώρα!</p>
                  <Link to="/products">
                    <Button className="rounded-3xl">Δείτε τα προϊόντα</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 pt-6">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const statusInfo = statusLabels[order.status] || { label: order.status, variant: 'secondary' as const };

                    return (
                      <div key={order.id} className="border rounded-2xl overflow-hidden">
                        {/* Order Header */}
                        <button
                          onClick={() => toggleOrderExpanded(order.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div>
                              <div className="font-medium">Παραγγελία #{orders.indexOf(order) + 1}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            <div className="font-semibold">{formatPrice(order.total)}</div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Order Details (Expanded) */}
                        {isExpanded && (
                          <div className="border-t bg-muted/30">
                            <div className="p-4 space-y-3">
                              {order.order_has_variants.map((item, idx) => {
                                const itemSubtotal = item.unit_price * item.quantity;
                                const itemVatAmount = itemSubtotal * (item.vat / 100);
                                const itemTotal = itemSubtotal + itemVatAmount;
                                const unitPriceWithVat = item.unit_price * (1 + item.vat / 100);
                                
                                return (
                                  <div key={idx} className="flex items-center gap-4">
                                    {item.variant?.base?.image_path ? (
                                      <img
                                        src={item.variant.base.image_path}
                                        alt={item.variant.base.name}
                                        className="w-16 h-16 object-cover rounded-md border"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{item.variant?.base?.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {item.variant?.variant_name} × {item.quantity}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">{formatPrice(itemTotal)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatPrice(unitPriceWithVat)} / τεμ. (ΦΠΑ {item.vat}%)
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <Separator />
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-muted-foreground">Σύνολο (με ΦΠΑ)</span>
                                <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}