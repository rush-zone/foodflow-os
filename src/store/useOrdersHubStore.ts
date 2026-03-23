import { create } from "zustand";

export type HubOrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type HubOrderType = "local" | "delivery" | "takeaway";

export interface HubOrder {
  id: string;
  number: number;
  customer: string;
  table?: string;
  type: HubOrderType;
  status: HubOrderStatus;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  createdAt: Date;
  closedAt?: Date;
}

interface OrdersHubStore {
  orders: HubOrder[];
  cancelOrder: (id: string) => void;
}

const now = Date.now();
const d = (minutes: number) => new Date(now - minutes * 60000);

const mockOrders: HubOrder[] = [
  {
    id: "h1", number: 42, customer: "Ana Beatriz", type: "delivery", status: "preparing",
    items: [{ name: "Double Smash", quantity: 1, price: 39.9 }, { name: "Batata Frita G", quantity: 1, price: 24.9 }, { name: "Coca-Cola", quantity: 2, price: 6.0 }],
    total: 76.8, paymentMethod: "PIX", createdAt: d(12),
  },
  {
    id: "h2", number: 41, customer: "Pedro Rocha", type: "delivery", status: "preparing",
    items: [{ name: "Pizza Pepperoni", quantity: 1, price: 52.0 }, { name: "Milkshake", quantity: 2, price: 16.9 }],
    total: 85.8, paymentMethod: "Cartão", createdAt: d(18),
  },
  {
    id: "h3", number: 40, customer: "Mesa 05", table: "Mesa 05", type: "local", status: "ready",
    items: [{ name: "Chicken Crispy", quantity: 2, price: 26.9 }, { name: "Onion Rings", quantity: 1, price: 16.9 }],
    total: 70.7, paymentMethod: "Dinheiro", createdAt: d(28),
  },
  {
    id: "h4", number: 39, customer: "Marcos Oliveira", type: "delivery", status: "delivered",
    items: [{ name: "Smash Burger", quantity: 3, price: 28.9 }, { name: "Batata Frita P", quantity: 2, price: 14.9 }],
    total: 116.5, paymentMethod: "PIX", createdAt: d(65), closedAt: d(18),
  },
  {
    id: "h5", number: 38, customer: "Mesa 02", table: "Mesa 02", type: "local", status: "delivered",
    items: [{ name: "Pizza Margherita", quantity: 2, price: 45.0 }],
    total: 90.0, paymentMethod: "Cartão", createdAt: d(80), closedAt: d(40),
  },
  {
    id: "h6", number: 37, customer: "Juliana Ferreira", type: "takeaway", status: "delivered",
    items: [{ name: "Smash Burger Clássico", quantity: 1, price: 28.9 }, { name: "Suco Natural", quantity: 1, price: 10.0 }],
    total: 38.9, paymentMethod: "PIX", createdAt: d(95), closedAt: d(60),
  },
  {
    id: "h7", number: 36, customer: "Mesa 08", table: "Mesa 08", type: "local", status: "cancelled",
    items: [{ name: "Pizza Pepperoni", quantity: 1, price: 52.0 }],
    total: 52.0, paymentMethod: "—", createdAt: d(110), closedAt: d(100),
  },
  {
    id: "h8", number: 35, customer: "Carlos Lima", type: "delivery", status: "delivered",
    items: [{ name: "Double Smash", quantity: 2, price: 39.9 }, { name: "Coca-Cola", quantity: 2, price: 6.0 }],
    total: 91.8, paymentMethod: "Cartão", createdAt: d(130), closedAt: d(85),
  },
  {
    id: "h9", number: 34, customer: "Mesa 03", table: "Mesa 03", type: "local", status: "pending",
    items: [{ name: "Brownie com Sorvete", quantity: 2, price: 18.9 }, { name: "Milkshake", quantity: 1, price: 16.9 }],
    total: 54.7, paymentMethod: "—", createdAt: d(3),
  },
  {
    id: "h10", number: 33, customer: "Fernanda Costa", type: "takeaway", status: "delivered",
    items: [{ name: "Chicken Crispy", quantity: 1, price: 26.9 }, { name: "Batata Frita P", quantity: 1, price: 14.9 }],
    total: 41.8, paymentMethod: "PIX", createdAt: d(150), closedAt: d(110),
  },
];

export const useOrdersHubStore = create<OrdersHubStore>((set) => ({
  orders: mockOrders,
  cancelOrder: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: "cancelled", closedAt: new Date() } : o
      ),
    })),
}));
