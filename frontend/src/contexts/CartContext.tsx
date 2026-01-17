import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

interface CartItem {
  variant_id: number;
  quantity: number;
  sell_mode: 'unit' | 'box';
  variant: {
    id: number;
    variant_name: string;
    unit_price: number;
    box_price: number | null;
    units_per_box: number | null;
    stock: number;
    base: {
      id: number;
      name: string;
      image_path: string | null;
      vat: number;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (variantId: number, quantity: number, sellMode: 'unit' | 'box') => Promise<void>;
  updateQuantity: (variantId: number, quantity: number, sellMode: 'unit' | 'box') => Promise<void>;
  removeFromCart: (variantId: number, sellMode: 'unit' | 'box') => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  vatAmount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCartItems = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('cart')
      .select(`
        variant_id,
        quantity,
        sell_mode,
        variant:variant_id (
          id,
          variant_name,
          unit_price,
          box_price,
          units_per_box,
          stock,
          base:base_id (
            id,
            name,
            image_path,
            vat
          )
        )
      `)
      .eq('profile_id', user.id);

    if (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης καλαθιού",
        variant: "destructive",
      });
    } else {
      setItems((data as unknown as CartItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const addToCart = async (variantId: number, quantity: number, sellMode: 'unit' | 'box') => {
    if (!user) {
      toast({
        title: "Απαιτείται σύνδεση",
        description: "Συνδεθείτε για να προσθέσετε προϊόντα στο καλάθι",
        variant: "destructive",
      });
      return;
    }

    // Check if item already exists in cart with same variant and sell mode
    const existingItem = items.find(item => item.variant_id === variantId && item.sell_mode === sellMode);
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('profile_id', user.id)
        .eq('variant_id', variantId)
        .eq('sell_mode', sellMode);

      if (error) {
        console.error('Error updating cart:', error);
        toast({
          title: "Σφάλμα",
          description: "Αποτυχία ενημέρωσης καλαθιού",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ενημερώθηκε",
          description: "Η ποσότητα ενημερώθηκε",
        });
        await fetchCartItems();
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart')
        .insert({
          profile_id: user.id,
          variant_id: variantId,
          quantity,
          sell_mode: sellMode,
        });

      if (error) {
        console.error('Error adding to cart:', error);
        toast({
          title: "Σφάλμα",
          description: "Αποτυχία προσθήκης στο καλάθι",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Προστέθηκε",
          description: "Το προϊόν προστέθηκε στο καλάθι",
        });
        await fetchCartItems();
      }
    }
  };

  const updateQuantity = async (variantId: number, quantity: number, sellMode: 'unit' | 'box') => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(variantId, sellMode);
      return;
    }

    // Optimistic update - update UI immediately
    setItems(prevItems => 
      prevItems.map(item => 
        item.variant_id === variantId && item.sell_mode === sellMode
          ? { ...item, quantity } 
          : item
      )
    );

    // Update database in background
    supabase
      .from('cart')
      .update({ quantity })
      .eq('profile_id', user.id)
      .eq('variant_id', variantId)
      .eq('sell_mode', sellMode)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating quantity:', error);
          // Revert on error
          fetchCartItems();
          toast({
            title: "Σφάλμα",
            description: "Αποτυχία ενημέρωσης ποσότητας",
            variant: "destructive",
          });
        }
      });
  };

  const removeFromCart = async (variantId: number, sellMode: 'unit' | 'box') => {
    if (!user) return;

    // Optimistic update - remove from UI immediately
    setItems(prevItems => prevItems.filter(item => !(item.variant_id === variantId && item.sell_mode === sellMode)));

    // Delete from database in background
    supabase
      .from('cart')
      .delete()
      .eq('profile_id', user.id)
      .eq('variant_id', variantId)
      .eq('sell_mode', sellMode)
      .then(({ error }) => {
        if (error) {
          console.error('Error removing from cart:', error);
          // Revert on error
          fetchCartItems();
          toast({
            title: "Σφάλμα",
            description: "Αποτυχία αφαίρεσης προϊόντος",
            variant: "destructive",
          });
        }
      });
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('profile_id', user.id);

    if (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία εκκαθάρισης καλαθιού",
        variant: "destructive",
      });
    } else {
      setItems([]);
    }
  };

  // Calculate subtotal (without VAT)
  const subtotal = items.reduce((sum, item) => {
    const price = item.sell_mode === 'unit' ? item.variant.unit_price : (item.variant.box_price || item.variant.unit_price);
    return sum + (price * item.quantity);
  }, 0);
  
  // Calculate total VAT amount
  const vatAmount = items.reduce((sum, item) => {
    const price = item.sell_mode === 'unit' ? item.variant.unit_price : (item.variant.box_price || item.variant.unit_price);
    const itemPrice = price * item.quantity;
    const itemVat = itemPrice * (item.variant.base.vat / 100);
    return sum + itemVat;
  }, 0);
  
  // Total including VAT
  const total = subtotal + vatAmount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      vatAmount,
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