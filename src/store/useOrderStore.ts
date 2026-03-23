import { create } from "zustand";
import { OrderItem, Product, PaymentMethod, OrderStatus } from "@/types";

interface OrderStore {
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  discount: number;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscount: (discount: number) => void;
  confirmOrder: () => void;
  clearOrder: () => void;

  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  items: [],
  status: "draft",
  paymentMethod: null,
  discount: 0,

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, quantity: 1, notes: "" }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateNotes: (productId, notes) => {
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, notes } : i
      ),
    });
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setDiscount: (discount) => set({ discount }),

  confirmOrder: () => set({ status: "confirmed" }),

  clearOrder: () =>
    set({
      items: [],
      status: "draft",
      paymentMethod: null,
      discount: 0,
    }),

  subtotal: () =>
    get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    ),

  total: () => {
    const subtotal = get().subtotal();
    return subtotal - get().discount;
  },

  itemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
