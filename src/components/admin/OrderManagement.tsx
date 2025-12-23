import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// Greek order status enum values
type OrderStatus = 'Καταχωρημένη' | 'Προς Αποστολή' | 'Ολοκληρώθηκε' | 'Ακυρώθηκε';

interface Order {
  id: number;
  total: number;
  status: OrderStatus;
  date: string;
  user_email?: string;
  user_name?: string;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    // Fetch orders with user info via user_places_orders junction table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, date')
      .order('date', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }

    // For each order, fetch the user info via user_places_orders
    const ordersWithUsers = await Promise.all(
      (ordersData || []).map(async (order) => {
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
            .select('email, first_name, last_name')
            .eq('id', userLink.user_id)
            .single();

          if (userData) {
            user_email = userData.email || undefined;
            user_name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || undefined;
          }
        }

        return {
          ...order,
          user_email,
          user_name,
        };
      })
    );

    setOrders(ordersWithUsers);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
        description: "Η κατάσταση παραγγελίας ενημερώθηκε",
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
                <TableHead>Σύνολο</TableHead>
                <TableHead>Κατάσταση</TableHead>
                <TableHead>Ημερομηνία</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
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
                  <TableCell>{order.total.toFixed(2)}€</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.date).toLocaleDateString('el-GR')}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};