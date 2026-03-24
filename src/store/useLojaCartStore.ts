import { create } from "zustand";

export interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  stockLinks?: import("@/types").StockLink[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
  extras?: SelectedExtra[];
}

interface LojaCartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  updateExtras: (productId: string, extras: SelectedExtra[]) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

export const useLojaCartStore = create<LojaCartStore>((set, get) => ({
  items: [],

  add: (item) => {
    const existing = get().items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },

  remove: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().remove(productId); return; }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i
      ),
    });
  },

  updateNotes: (productId, notes) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, notes } : i
      ),
    }),

  updateExtras: (productId, extras) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, extras } : i
      ),
    }),

  clear: () => set({ items: [] }),

  subtotal: () =>
    get().items.reduce((sum, i) => {
      const extrasTotal = (i.extras ?? []).reduce((s, e) => s + e.price, 0);
      return sum + (i.price + extrasTotal) * i.quantity;
    }, 0),

  count: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
