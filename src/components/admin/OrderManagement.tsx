import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Greek order status enum values
type OrderStatus = 'Καταχωρημένη' | 'Προς Αποστολή' | 'Ολοκληρώθηκε' | 'Ακυρώθηκε';

interface Order {
  id: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  user_email?: string;
  user_name?: string;
  products: { name: string; quantity: number }[];
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<'created_at' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchOrders = async () => {
    // Fetch orders with user info via user_places_orders junction table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .order(sortField, { ascending: sortDirection === 'asc' });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }

    // For each order, fetch the user info and products
    const ordersWithDetails = await Promise.all(
      (ordersData || []).map(async (order) => {
        // Fetch user
        const { data: userLink } = await supabase
          .from('user_places_orders')
          .select('user_id')
          .eq('order_id', order.id)
          .single();

        let user_email: string | undefined;
        let user_name: string | undefined;

        if (userLink?.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userLink.user_id)
            .single();

          if (userData) {
            user_email = userData.email || undefined;
            user_name = userData.full_name || undefined;
          }
        }

        // Fetch products
        const { data: orderProducts } = await supabase
          .from('orders_include_products')
          .select('quantity, products(name)')
          .eq('order_id', order.id);

        const products = orderProducts?.map(p => ({
          name: (p.products as any).name,
          quantity: p.quantity
        })) || [];

        return {
          ...order,
          user_email,
          user_name,
          products,
        };
      })
    );

    setOrders(ordersWithDetails);
  };

  useEffect(() => {
    fetchOrders();
    fetchPickupLocations();
  }, [sortField, sortDirection]);

  const handleSort = (field: 'created_at' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchPickupLocations = async () => {
    setPickupLoading(true);
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching pickup locations:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης σημείων παραλαβής",
        variant: "destructive",
      });
    } else {
      setPickupLocations(data || []);
    }
    setPickupLoading(false);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      owner_full_name: '',
      owner_phone_number: '',
      working_hours: '',
      package_capacity: 0,
      country: '',
      city: '',
      street: '',
      number: '',
      zip: '',
    });
    setDialogOpen(true);
  };

  const handleEditLocation = (location: PickupLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      owner_full_name: location.owner_full_name,
      owner_phone_number: location.owner_phone_number,
      working_hours: location.working_hours,
      package_capacity: location.package_capacity,
      country: location.country,
      city: location.city,
      street: location.street,
      number: location.number,
      zip: location.zip,
    });
    setDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    setPickupLoading(true);
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('pickup_locations')
          .update(formData)
          .eq('id', editingLocation.id);

        if (error) throw error;
        toast({
          title: "Επιτυχία",
          description: "Το σημείο παραλαβής ενημερώθηκε",
        });
      } else {
        const { error } = await supabase
          .from('pickup_locations')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Επιτυχία",
          description: "Το σημείο παραλαβής προστέθηκε",
        });
      }
      setDialogOpen(false);
      fetchPickupLocations();
    } catch (error: any) {
      console.error('Error saving pickup location:', error);
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    }
    setPickupLoading(false);
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σημείο παραλαβής;')) return;

    setPickupLoading(true);
    try {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Επιτυχία",
        description: "Το σημείο παραλαβής διαγράφηκε",
      });
      fetchPickupLocations();
    } catch (error: any) {
      console.error('Error deleting pickup location:', error);
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    }
    setPickupLoading(false);
  };

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
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
        description: "H κατάσταση παραγγελίας ενημερώθηκε",
      });
      fetchOrders();
    }

    setLoading(false);
  };

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Καταχωρημένη':
        return 'secondary';
      case 'Προς Αποστολή':
        return 'default';
      case 'Ολοκληρώθηκε':
        return 'default';
      case 'Ακυρώθηκε':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Διαχείριση Παραγγελιών</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Κωδικός</TableHead>
                <TableHead>Πελάτης</TableHead>
                <TableHead>Προϊόντα</TableHead>
                <TableHead>Σύνολο</TableHead>
                <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                  <div className="flex items-center gap-1">
                    Κατάσταση {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer">
                  <div className="flex items-center gap-1">
                    Ημερομηνία {sortField === 'created_at' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Φόρτωση...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Δεν βρέθηκαν παραγγελίες
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.user_name || 'Άγνωστος'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.user_email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>{order.total.toFixed(2)}€</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('el-GR')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Καταχωρημένη">Καταχωρημένη</SelectItem>
                          <SelectItem value="Προς Αποστολή">Προς Αποστολή</SelectItem>
                          <SelectItem value="Ολοκληρώθηκε">Ολοκληρώθηκε</SelectItem>
                          <SelectItem value="Ακυρώθηκε">Ακυρώθηκε</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};