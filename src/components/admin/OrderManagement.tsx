import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp, Package, User } from 'lucide-react';

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
  total: number;
  status: 'submitted' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  profile_id: string;
  profile?: { name: string | null; surname: string | null; telephone: string | null; city: string | null; street: string | null; zip: string | null; company_name: string | null; afm_number: string | null } | null;
  order_has_variants: OrderItem[];
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        profile_id,
        profile:profile_id (name, surname, telephone, city, street, zip, company_name, afm_number),
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders((data as unknown as Order[]) || []);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const updateOrderStatus = async (orderId: number, status: 'submitted' | 'confirmed' | 'completed' | 'cancelled') => {
    setLoading(true);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Επιτυχία",
        description: "Η κατάσταση της παραγγελίας ενημερώθηκε",
      });
      fetchOrders();
    }

    setLoading(false);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'submitted':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Υποβλήθηκε';
      case 'confirmed':
        return 'Επιβεβαιώθηκε';
      case 'completed':
        return 'Ολοκληρώθηκε';
      case 'cancelled':
        return 'Ακυρώθηκε';
      default:
        return status;
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
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Διαχείριση Παραγγελιών</CardTitle>
        <CardDescription>Δείτε και διαχειριστείτε όλες τις παραγγελίες</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν παραγγελίες</h3>
            <p className="text-muted-foreground">Οι παραγγελίες θα εμφανιστούν εδώ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const customerName = order.profile?.name || order.profile?.surname
                ? `${order.profile?.name || ''} ${order.profile?.surname || ''}`.trim()
                : null;

              return (
                <div key={order.id} className="border rounded-3xl overflow-hidden">
                  {/* Order Header */}
                  <button
                    onClick={() => toggleOrderExpanded(order.id)}
                    className="w-full p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/50 transition-colors text-left gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">Παραγγελία #{order.id}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {customerName || <span>ID: {order.profile_id.slice(0, 8)}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
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
                      <div className="p-4 space-y-4">
                        {/* Customer Info */}
                        <div className="grid gap-4 md:grid-cols-2 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium">Στοιχεία Πελάτη</div>
                            <div>{customerName || 'Δεν διατίθεται'}</div>
                            {order.profile?.telephone && <div>Τηλ: {order.profile.telephone}</div>}
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">Διεύθυνση</div>
                            {order.profile?.street || order.profile?.city ? (
                              <div>
                                {order.profile?.street && <span>{order.profile.street}, </span>}
                                {order.profile?.city && <span>{order.profile.city} </span>}
                                {order.profile?.zip && <span>{order.profile.zip}</span>}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">Δεν διατίθεται</div>
                            )}
                          </div>
                          {(order.profile?.company_name || order.profile?.afm_number) && (
                            <div className="space-y-1">
                              <div className="font-medium">Στοιχεία Τιμολόγησης</div>
                              {order.profile?.company_name && <div>{order.profile.company_name}</div>}
                              {order.profile?.afm_number && <div>ΑΦΜ: {order.profile.afm_number}</div>}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="font-medium">Αλλαγή Κατάστασης</div>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value as 'submitted' | 'confirmed' | 'completed' | 'cancelled')}
                              disabled={loading}
                            >
                              <SelectTrigger className="w-40 -ml-2 rounded-3xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                <SelectItem className="rounded-xl" value="submitted">Υποβλήθηκε</SelectItem>
                                <SelectItem className="rounded-xl" value="confirmed">Επιβεβαιώθηκε</SelectItem>
                                <SelectItem className="rounded-xl" value="completed">Ολοκληρώθηκε</SelectItem>
                                <SelectItem className="rounded-xl" value="cancelled">Ακυρώθηκε</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator />

                        {/* Order Items */}
                        <div className="space-y-3">
                          <div className="font-medium text-sm">Προϊόντα</div>
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
                        </div>

                        <Separator />

                        {/* Order Total */}
                        <div className="flex justify-between items-center">
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
  );
};