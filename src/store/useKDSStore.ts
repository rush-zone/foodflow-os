import { create } from "zustand";

export type KDSStatus = "new" | "preparing" | "ready";

export interface KDSItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface KDSOrder {
  id: string;
  number: number;
  table: string;
  status: KDSStatus;
  items: KDSItem[];
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

interface KDSStore {
  orders: KDSOrder[];
  startPreparing: (id: string) => void;
  markReady: (id: string) => void;
  dismiss: (id: string) => void;
}

const mockOrders: KDSOrder[] = [
  {
    id: "k1",
    number: 42,
    table: "Mesa 03",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    items: [
      { name: "Smash Burger Clássico", quantity: 2 },
      { name: "Batata Frita G", quantity: 1 },
      { name: "Coca-Cola 350ml", quantity: 2 },
    ],
  },
  {
    id: "k2",
    number: 41,
    table: "Mesa 07",
    status: "new",
    createdAt: new Date(Date.now() - 7 * 60 * 1000),
    items: [
      { name: "Pizza Pepperoni", quantity: 1, notes: "Sem cebola" },
      { name: "Suco Natural", quantity: 2 },
    ],
  },
  {
    id: "k3",
    number: 40,
    table: "Balcão",
    status: "preparing",
    createdAt: new Date(Date.now() - 12 * 60 * 1000),
    startedAt: new Date(Date.now() - 9 * 60 * 1000),
    items: [
      { name: "Double Smash", quantity: 1 },
      { name: "Chicken Crispy", quantity: 1, notes: "Sem pickle" },
      { name: "Onion Rings", quantity: 1 },
    ],
  },
  {
    id: "k4",
    number: 39,
    table: "Mesa 01",
    status: "preparing",
    createdAt: new Date(Date.now() - 18 * 60 * 1000),
    startedAt: new Date(Date.now() - 14 * 60 * 1000),
    items: [
      { name: "Pizza Margherita", quantity: 2 },
    ],
  },
  {
    id: "k5",
    number: 38,
    table: "Mesa 05",
    status: "ready",
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    startedAt: new Date(Date.now() - 22 * 60 * 1000),
    finishedAt: new Date(Date.now() - 3 * 60 * 1000),
    items: [
      { name: "Milkshake", quantity: 3 },
      { name: "Brownie com Sorvete", quantity: 2 },
    ],
  },
];

export const useKDSStore = create<KDSStore>((set) => ({
  orders: mockOrders,

  startPreparing: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: "preparing", startedAt: new Date() } : o
      ),
    })),

  markReady: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: "ready", finishedAt: new Date() } : o
      ),
    })),

  dismiss: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),
}));
