import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, colour: string, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  lastRemovedItem: CartItem | null;
  undoRemove: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lass_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = (product: Product, size: string, colour: string, quantity = 1) => {
    setCart((prev) => {
      const itemKey = `${product.id}-${size}-${colour}`;
      const existingIndex = prev.findIndex((i) => i.id === itemKey);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      } else {
        const newItem: CartItem = {
          id: itemKey,
          productId: product.id,
          product,
          selectedSize: size,
          selectedColour: colour,
          quantity,
        };
        return [...prev, newItem];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, 50) } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (itemToRemove) {
        setLastRemovedItem(itemToRemove);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const undoRemove = () => {
    if (lastRemovedItem) {
      setCart((prev) => [...prev, lastRemovedItem]);
      setLastRemovedItem(null);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        lastRemovedItem,
        undoRemove,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
