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
          stock
        )
      `)
      .eq('user_id', dbUserId);

    if (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
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
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
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
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
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
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Added to cart",
      description: "Item added successfully",
    });
    await fetchCartItems();
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user || !dbUserId) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', dbUserId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } else {
      await fetchCartItems();
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!user || !dbUserId) return;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', dbUserId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    } else {
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
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
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