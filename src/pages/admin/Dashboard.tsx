import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { TagManagement } from '@/components/admin/TagManagement';
import { SiteSettingsManagement } from '@/components/admin/SiteSettingsManagement';
import { Package, ShoppingCart, Users, Tag, Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Stats {
  totalProducts: number;
  totalVariants: number;
  totalOrders: number;
  totalCustomers: number;
  totalTags: number;
}

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalVariants: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalTags: 0,
  });

  const fetchStats = async () => {
    try {
      // Get product bases count
      const { count: productCount } = await supabase
        .from('product_bases')
        .select('*', { count: 'exact', head: true });

      // Get variants count
      const { count: variantCount } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true });

      // Get order count
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get customer count
      const { count: customerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Get tags count
      const { count: tagCount } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProducts: productCount || 0,
        totalVariants: variantCount || 0,
        totalOrders: orderCount || 0,
        totalCustomers: customerCount || 0,
        totalTags: tagCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Προϊόντα</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.totalVariants} παραλλαγές</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Παραγγελίες</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Πελάτες</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ετικέτες</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 p-1 rounded-2xl">
          <TabsTrigger className="rounded-full text-xs sm:text-sm" value="products">Προϊόντα</TabsTrigger>
          <TabsTrigger className="rounded-full text-xs sm:text-sm" value="categories">Κατηγορίες</TabsTrigger>
          <TabsTrigger className="rounded-full text-xs sm:text-sm" value="tags">Ετικέτες</TabsTrigger>
          <TabsTrigger className="rounded-full text-xs sm:text-sm" value="orders">Παραγγελίες</TabsTrigger>
          <TabsTrigger className="rounded-full text-xs sm:text-sm" value="settings">Ρυθμίσεις</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagement onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="tags">
          <TagManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SiteSettingsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}