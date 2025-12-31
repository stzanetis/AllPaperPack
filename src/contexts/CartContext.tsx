import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

interface CartItem {
  product_id: number;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
    vat: number;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, dbUserId } = useAuth();

  const fetchCartItems = async () => {
    if (!user || !dbUserId) {
      setItems([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('cart')
      .select(`
        product_id,
        quantity,
        product:products (
          name,
          price,
          image_url,
          stock,
          vat
        )
      `)
      .eq('user_id', dbUserId);

    if (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Σφάλμα φόρτωσης καλαθιού",
        description: "Αδυναμία φόρτωσης προϊόντων καλαθιού",
        variant: "destructive",
        duration: 1000,
      });
    } else {
      // Map the data to our CartItem interface
      const cartItems: CartItem[] = (data || []).map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product
      }));
      setItems(cartItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartItems();
  }, [user, dbUserId]);

  const addToCart = async (productId: number, quantity: number) => {
    if (!user || !dbUserId) {
      toast({
        title: "Σφάλμα σύνδεσης",
        description: "Συνδεθείτε για να προσθέσετε προϊόντα στο καλάθι σας",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }

    // Check if item already exists in cart
    const existingItem = items.find(item => item.product_id === productId);
    
    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('user_id', dbUserId)
        .eq('product_id', productId);

      if (error) {
        console.error('Error updating cart:', error);
        toast({
          title: "Σφάλμα",
          description: "Αποτυχία προσθήκης προϊόντος στο καλάθι",
          variant: "destructive",
          duration: 1000,
        });
        return;
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart')
        .insert({
          user_id: dbUserId,
          product_id: productId,
          quantity,
        });

      if (error) {
        console.error('Error adding to cart:', error);
        toast({
          title: "Σφάλμα",
          description: "Αποτυχία προσθήκης προϊόντος στο καλάθι",
          variant: "destructive",
          duration: 1000,
        });
        return;
      }
    }
    await fetchCartItems();
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user || !dbUserId) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, quantity } : item
    ));

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', dbUserId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης ποσότητας",
        variant: "destructive",
        duration: 1000,
      });
      // Revert optimistic update
      await fetchCartItems();
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!user || !dbUserId) return;

    // Optimistically remove from local state first
    setItems(prevItems => prevItems.filter(item => item.product_id !== productId));

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', dbUserId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αφαίρεσης προϊόντος από το καλάθι",
        variant: "destructive",
        duration: 1000,
      });
      // Revert the optimistic update on error
      await fetchCartItems();
    }
  };

  const clearCart = async () => {
    if (!user || !dbUserId) return;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', dbUserId);

    if (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία εκκαθάρισης καλαθιού",
        variant: "destructive",
        duration: 1000,
      });
    } else {
      setItems([]);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      total,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};