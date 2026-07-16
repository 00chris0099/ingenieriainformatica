import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  sku?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return { items: state.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0 ? state.items.filter((i) => i.productId !== productId) : state.items.map((i) => i.productId === productId ? { ...i, quantity } : i),
        })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'adriskids-cart' }
  )
);
