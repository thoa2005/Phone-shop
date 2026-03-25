import { create } from 'zustand';
import apiClient from '../lib/api';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  productPrice: number;
  salePrice: number;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalPrice: 0,
  totalItems: 0,
  fetchCart: async () => {
    try {
      const { data } = await apiClient.get('/cart');
      set({ items: data.items, totalPrice: data.totalPrice, totalItems: data.totalItems });
    } catch (e) {
      console.error(e);
    }
  },
  addToCart: async (productId, quantity) => {
    const { data } = await apiClient.post('/cart/items', { productId, quantity });
    set({ items: data.items, totalPrice: data.totalPrice, totalItems: data.totalItems });
  },
  updateQuantity: async (itemId, quantity) => {
    const { data } = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    set({ items: data.items, totalPrice: data.totalPrice, totalItems: data.totalItems });
  },
  removeItem: async (itemId) => {
    const { data } = await apiClient.delete(`/cart/items/${itemId}`);
    set({ items: data.items, totalPrice: data.totalPrice, totalItems: data.totalItems });
  }
}));
