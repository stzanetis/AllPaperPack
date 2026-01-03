import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface Order {
  id: number;
  total: number;
  status: 'submitted' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  profile_id: string;
  profile?: { name: string | null; surname: string | null } | null;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        profile_id,
        profile:profile_id (name, surname)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: number, status: 'submitted' | 'confirmed' | 'completed' | 'cancelled') => {
    setLoading(true);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders();
    }

    setLoading(false);
  };

  const getStatusVariant = (status: string) => {
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
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
                      {order.profile?.name || order.profile?.surname
                        ? `${order.profile?.name || ''} ${order.profile?.surname || ''}`.trim()
                        : <span className="text-muted-foreground">ID: {order.profile_id.slice(0, 8)}</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>€{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value as 'submitted' | 'confirmed' | 'completed' | 'cancelled')}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Υποβλήθηκε</SelectItem>
                        <SelectItem value="confirmed">Επιβεβαιώθηκε</SelectItem>
                        <SelectItem value="completed">Ολοκληρώθηκε</SelectItem>
                        <SelectItem value="cancelled">Ακυρώθηκε</SelectItem>
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