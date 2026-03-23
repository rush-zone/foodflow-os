import { create } from "zustand";

export type DeliveryStatus =
  | "confirmed"   // Pedido confirmado
  | "preparing"   // Em preparo
  | "ready"       // Pronto para retirada
  | "picked_up"   // Motoboy coletou
  | "on_the_way"  // A caminho
  | "delivered"   // Entregue
  | "failed";     // Falha na entrega

export interface Motoboy {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  avatar: string;
  available: boolean;
}

export interface DeliveryEvent {
  status: DeliveryStatus;
  timestamp: Date;
  note?: string;
}

export interface DeliveryOrder {
  id: string;
  number: number;
  customer: string;
  phone: string;
  address: string;
  neighborhood: string;
  distance: string;
  estimatedMinutes: number;
  status: DeliveryStatus;
  motoboy?: Motoboy;
  items: { name: string; quantity: number }[];
  total: number;
  timeline: DeliveryEvent[];
  createdAt: Date;
  paymentMethod: string;
}

interface DeliveryStore {
  orders: DeliveryOrder[];
  selectedId: string | null;
  select: (id: string) => void;
  advanceStatus: (id: string) => void;
  assignMotoboy: (orderId: string, motoboyId: string) => void;
  motoboys: Motoboy[];
}

const motoboys: Motoboy[] = [
  {
    id: "m1",
    name: "Carlos Silva",
    phone: "(11) 99999-1111",
    vehicle: "Moto",
    plate: "ABC-1234",
    avatar: "CS",
    available: false,
  },
  {
    id: "m2",
    name: "Rafael Lima",
    phone: "(11) 99999-2222",
    vehicle: "Moto",
    plate: "DEF-5678",
    avatar: "RL",
    available: true,
  },
  {
    id: "m3",
    name: "Bruno Costa",
    phone: "(11) 99999-3333",
    vehicle: "Bicicleta",
    plate: "—",
    avatar: "BC",
    available: false,
  },
];

const now = Date.now();

const mockOrders: DeliveryOrder[] = [
  {
    id: "d1",
    number: 42,
    customer: "Ana Beatriz",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123 — Apto 4B",
    neighborhood: "Vila Madalena",
    distance: "2,3 km",
    estimatedMinutes: 35,
    status: "on_the_way",
    motoboy: motoboys[0],
    items: [
      { name: "Double Smash", quantity: 1 },
      { name: "Batata Frita G", quantity: 1 },
      { name: "Coca-Cola 350ml", quantity: 2 },
    ],
    total: 76.8,
    paymentMethod: "PIX",
    createdAt: new Date(now - 32 * 60000),
    timeline: [
      { status: "confirmed", timestamp: new Date(now - 32 * 60000) },
      { status: "preparing", timestamp: new Date(now - 30 * 60000) },
      { status: "ready",     timestamp: new Date(now - 14 * 60000) },
      { status: "picked_up", timestamp: new Date(now - 11 * 60000) },
      { status: "on_the_way",timestamp: new Date(now - 11 * 60000) },
    ],
  },
  {
    id: "d2",
    number: 41,
    customer: "Pedro Rocha",
    phone: "(11) 91234-5678",
    address: "Av. Paulista, 900 — Sala 12",
    neighborhood: "Bela Vista",
    distance: "4,1 km",
    estimatedMinutes: 50,
    status: "preparing",
    motoboy: motoboys[2],
    items: [
      { name: "Pizza Pepperoni", quantity: 1 },
      { name: "Milkshake", quantity: 2 },
    ],
    total: 85.8,
    paymentMethod: "Cartão",
    createdAt: new Date(now - 18 * 60000),
    timeline: [
      { status: "confirmed", timestamp: new Date(now - 18 * 60000) },
      { status: "preparing", timestamp: new Date(now - 16 * 60000) },
    ],
  },
  {
    id: "d3",
    number: 40,
    customer: "Juliana Ferreira",
    phone: "(11) 97777-8888",
    address: "Rua Augusta, 500 — Casa",
    neighborhood: "Consolação",
    distance: "1,8 km",
    estimatedMinutes: 25,
    status: "ready",
    items: [
      { name: "Chicken Crispy", quantity: 2 },
      { name: "Onion Rings", quantity: 1 },
    ],
    total: 70.7,
    paymentMethod: "Dinheiro",
    createdAt: new Date(now - 28 * 60000),
    timeline: [
      { status: "confirmed", timestamp: new Date(now - 28 * 60000) },
      { status: "preparing", timestamp: new Date(now - 25 * 60000) },
      { status: "ready",     timestamp: new Date(now - 5 * 60000) },
    ],
  },
  {
    id: "d4",
    number: 39,
    customer: "Marcos Oliveira",
    phone: "(11) 96666-5555",
    address: "Rua Oscar Freire, 220",
    neighborhood: "Jardins",
    distance: "3,5 km",
    estimatedMinutes: 40,
    status: "delivered",
    motoboy: motoboys[0],
    items: [
      { name: "Smash Burger Clássico", quantity: 3 },
      { name: "Batata Frita P", quantity: 2 },
    ],
    total: 116.5,
    paymentMethod: "PIX",
    createdAt: new Date(now - 65 * 60000),
    timeline: [
      { status: "confirmed",  timestamp: new Date(now - 65 * 60000) },
      { status: "preparing",  timestamp: new Date(now - 62 * 60000) },
      { status: "ready",      timestamp: new Date(now - 45 * 60000) },
      { status: "picked_up",  timestamp: new Date(now - 42 * 60000) },
      { status: "on_the_way", timestamp: new Date(now - 42 * 60000) },
      { status: "delivered",  timestamp: new Date(now - 18 * 60000) },
    ],
  },
];

const statusFlow: DeliveryStatus[] = [
  "confirmed", "preparing", "ready", "picked_up", "on_the_way", "delivered",
];

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  orders: mockOrders,
  motoboys,
  selectedId: "d1",

  select: (id) => set({ selectedId: id }),

  advanceStatus: (id) => {
    const order = get().orders.find((o) => o.id === id);
    if (!order) return;
    const idx = statusFlow.indexOf(order.status);
    if (idx === -1 || idx >= statusFlow.length - 1) return;
    const next = statusFlow[idx + 1];
    const event: DeliveryEvent = { status: next, timestamp: new Date() };
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, status: next, timeline: [...o.timeline, event] }
          : o
      ),
    });
  },

  assignMotoboy: (orderId, motoboyId) => {
    const motoboy = get().motoboys.find((m) => m.id === motoboyId);
    if (!motoboy) return;
    set({
      orders: get().orders.map((o) =>
        o.id === orderId ? { ...o, motoboy } : o
      ),
      motoboys: get().motoboys.map((m) =>
        m.id === motoboyId ? { ...m, available: false } : m
      ),
    });
  },
}));
