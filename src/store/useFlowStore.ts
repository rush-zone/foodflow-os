import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type FlowStatus =
  | "pending"     // confirmado no PDV, aguardando cozinha
  | "preparing"   // KDS iniciou preparo
  | "ready"       // KDS marcou pronto
  | "picked_up"   // motoboy coletou
  | "on_the_way"  // a caminho
  | "delivered"   // entregue / retirado
  | "cancelled";

export type OrderType = "local" | "delivery" | "takeaway";
export type FlowPlatform = "proprio" | "ifood" | "rappi" | "anota_ai" | "whatsapp";
export type FlowPayment = "cash" | "card" | "pix" | "card_delivery";

export interface FlowItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface FlowMotoboy {
  id: string;
  name: string;
  phone: string;
  vehicle: string;      // tipo: Moto, Bicicleta, Carro, Van
  vehicleModel: string; // ex: Honda CG 160
  plate: string;
  avatar: string;
  source: "proprio" | "app";
  pin: string;          // 4 dígitos — definido pelo gerente
  cnhPhoto?: string;    // base64 da foto da CNH
  facePhoto?: string;   // base64 da foto de reconhecimento facial
  onboarded?: boolean;  // true após o motoboy completar o cadastro na primeira sessão
}

export interface FlowEvent {
  status: FlowStatus;
  timestamp: Date;
  note?: string;
}

export interface FlowOrder {
  id: string;
  number: number;
  type: OrderType;
  platform: FlowPlatform;
  customer: string;
  table?: string;
  address?: string;
  neighborhood?: string;
  phone?: string;
  items: FlowItem[];
  total: number;
  discount: number;
  paymentMethod: FlowPayment;
  status: FlowStatus;
  timeline: FlowEvent[];
  motoboy?: FlowMotoboy;
  deliveryCode: string;   // 4-digit code customer shows to motoboy
  createdAt: Date;
  closedAt?: Date;
}

const motoboys: FlowMotoboy[] = [
  { id: "m1", name: "Carlos Silva",  phone: "(11) 99999-1111", vehicle: "Moto",      vehicleModel: "Honda CG 160",   plate: "ABC-1234", avatar: "CS", source: "proprio", pin: "1111" },
  { id: "m2", name: "Rafael Lima",   phone: "(11) 99999-2222", vehicle: "Moto",      vehicleModel: "Yamaha Factor",  plate: "DEF-5678", avatar: "RL", source: "proprio", pin: "2222" },
  { id: "m3", name: "Bruno Costa",   phone: "(11) 99999-3333", vehicle: "Bicicleta", vehicleModel: "Caloi 10",       plate: "—",        avatar: "BC", source: "proprio", pin: "3333" },
];

// ---- mock seed orders ----
let _counter = 30;
const now = Date.now();
const d = (m: number) => new Date(now - m * 60000);
const ev = (s: FlowStatus, m: number): FlowEvent => ({ status: s, timestamp: d(m) });

const seedOrders: FlowOrder[] = [
  {
    id: "f1", number: 42, type: "delivery", platform: "ifood", customer: "Ana Beatriz",
    phone: "(11) 98765-4321", address: "Rua das Flores, 123 — Apto 4B", neighborhood: "Vila Madalena",
    items: [
      { productId: "2", name: "Double Smash",    quantity: 1, price: 39.9 },
      { productId: "8", name: "Batata Frita G",  quantity: 1, price: 24.9 },
      { productId: "6", name: "Coca-Cola 350ml", quantity: 2, price: 6.0  },
    ],
    total: 76.8, discount: 0, paymentMethod: "pix", status: "on_the_way", motoboy: motoboys[0],
    timeline: [ev("pending",32), ev("preparing",30), ev("ready",14), ev("picked_up",11), ev("on_the_way",11)],
    deliveryCode: "3847", createdAt: d(32),
  },
  {
    id: "f2", number: 41, type: "delivery", platform: "rappi", customer: "Pedro Rocha",
    phone: "(11) 91234-5678", address: "Av. Paulista, 900 — Sala 12", neighborhood: "Bela Vista",
    items: [
      { productId: "5", name: "Pizza Pepperoni", quantity: 1, price: 52.0 },
      { productId: "11", name: "Milkshake",      quantity: 2, price: 16.9 },
    ],
    total: 85.8, discount: 0, paymentMethod: "card", status: "preparing",
    timeline: [ev("pending",18), ev("preparing",16)],
    deliveryCode: "6192", createdAt: d(18),
  },
  {
    id: "f3", number: 40, type: "local", platform: "proprio", customer: "Mesa 05", table: "Mesa 05",
    items: [
      { productId: "3", name: "Chicken Crispy", quantity: 2, price: 26.9 },
      { productId: "12", name: "Onion Rings",   quantity: 1, price: 16.9 },
    ],
    total: 70.7, discount: 0, paymentMethod: "cash", status: "ready",
    timeline: [ev("pending",28), ev("preparing",25), ev("ready",5)],
    deliveryCode: "5034", createdAt: d(28),
  },
  {
    id: "f4", number: 39, type: "delivery", platform: "whatsapp", customer: "Marcos Oliveira",
    phone: "(11) 96666-5555", address: "Rua Oscar Freire, 220", neighborhood: "Jardins",
    items: [
      { productId: "1", name: "Smash Burger Clássico", quantity: 3, price: 28.9 },
      { productId: "8", name: "Batata Frita P",        quantity: 2, price: 14.9 },
    ],
    total: 116.5, discount: 0, paymentMethod: "pix", status: "delivered", motoboy: motoboys[0],
    timeline: [ev("pending",65), ev("preparing",62), ev("ready",45), ev("picked_up",42), ev("on_the_way",42), ev("delivered",18)],
    deliveryCode: "7261", createdAt: d(65), closedAt: d(18),
  },
  {
    id: "f5", number: 38, type: "local", platform: "proprio", customer: "Mesa 02", table: "Mesa 02",
    items: [{ productId: "4", name: "Pizza Margherita", quantity: 2, price: 45.0 }],
    total: 90.0, discount: 0, paymentMethod: "card", status: "delivered",
    timeline: [ev("pending",80), ev("preparing",77), ev("ready",55), ev("delivered",40)],
    deliveryCode: "4418", createdAt: d(80), closedAt: d(40),
  },
  {
    id: "f6", number: 37, type: "takeaway", platform: "anota_ai", customer: "Juliana Ferreira",
    phone: "(11) 97777-8888",
    items: [
      { productId: "1", name: "Smash Burger Clássico", quantity: 1, price: 28.9 },
      { productId: "7", name: "Suco Natural",          quantity: 1, price: 10.0 },
    ],
    total: 38.9, discount: 0, paymentMethod: "pix", status: "delivered",
    timeline: [ev("pending",95), ev("preparing",93), ev("ready",75), ev("delivered",60)],
    deliveryCode: "9023", createdAt: d(95), closedAt: d(60),
  },
  {
    id: "f7", number: 36, type: "local", platform: "proprio", customer: "Mesa 08", table: "Mesa 08",
    items: [{ productId: "5", name: "Pizza Pepperoni", quantity: 1, price: 52.0 }],
    total: 52.0, discount: 0, paymentMethod: "cash", status: "cancelled",
    timeline: [ev("pending",110), ev("cancelled",100)],
    deliveryCode: "1155", createdAt: d(110), closedAt: d(100),
  },
  {
    id: "f8", number: 35, type: "local", platform: "proprio", customer: "Mesa 03", table: "Mesa 03",
    items: [
      { productId: "10", name: "Brownie com Sorvete", quantity: 2, price: 18.9 },
      { productId: "11", name: "Milkshake",           quantity: 1, price: 16.9 },
    ],
    total: 54.7, discount: 0, paymentMethod: "cash", status: "pending",
    timeline: [ev("pending",3)],
    deliveryCode: "2978", createdAt: d(3),
  },
];

const availableMotoboys = new Set(["m2"]);

interface FlowStore {
  orders: FlowOrder[];
  motoboys: FlowMotoboy[];
  availableMotoboys: Set<string>;

  // PDV → cria novo pedido
  createOrder: (data: Omit<FlowOrder, "id" | "number" | "status" | "timeline" | "createdAt" | "deliveryCode">) => string;

  // KDS
  startPreparing: (id: string) => void;
  markReady: (id: string) => void;

  // Delivery
  assignMotoboy: (orderId: string, motoboyId: string) => void;
  advanceDelivery: (id: string) => void;

  // Hub
  cancelOrder:    (id: string) => void;
  markDelivered:  (id: string) => void;

  // Gerenciamento de motoboys (gerente/admin)
  addMotoboy:    (data: Omit<FlowMotoboy, "id" | "avatar">) => void;
  updateMotoboy: (id: string, data: Partial<Omit<FlowMotoboy, "id">>) => void;
  removeMotoboy: (id: string) => void;

  // Dev / admin
  resetOrders: () => void;
}

const deliveryFlow: FlowStatus[] = ["ready", "picked_up", "on_the_way", "delivered"];

export const useFlowStore = create<FlowStore>()(persist((set, get) => ({
  orders: seedOrders,
  motoboys,
  availableMotoboys,

  createOrder: (data) => {
    _counter += 1;
    const id = `f${Date.now()}`;
    const deliveryCode = String(Math.floor(1000 + Math.random() * 9000));
    const order: FlowOrder = {
      ...data,
      id,
      number: _counter,
      status: "pending",
      timeline: [{ status: "pending", timestamp: new Date() }],
      deliveryCode,
      createdAt: new Date(),
    };
    set({ orders: [order, ...get().orders] });
    return id;
  },

  startPreparing: (id) =>
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, status: "preparing", timeline: [...o.timeline, { status: "preparing", timestamp: new Date() }] }
          : o
      ),
    }),

  markReady: (id) =>
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, status: "ready", timeline: [...o.timeline, { status: "ready", timestamp: new Date() }] }
          : o
      ),
    }),

  assignMotoboy: (orderId, motoboyId) => {
    const motoboy = get().motoboys.find((m) => m.id === motoboyId);
    if (!motoboy) return;
    const next = new Set(get().availableMotoboys);
    next.delete(motoboyId);
    set({
      orders: get().orders.map((o) => o.id === orderId ? { ...o, motoboy } : o),
      availableMotoboys: next,
    });
  },

  advanceDelivery: (id) => {
    const order = get().orders.find((o) => o.id === id);
    if (!order) return;
    const idx = deliveryFlow.indexOf(order.status);
    if (idx === -1 || idx >= deliveryFlow.length - 1) return;
    const next = deliveryFlow[idx + 1];
    const closed = next === "delivered" ? new Date() : undefined;
    if (next === "delivered" && order.motoboy) {
      const av = new Set(get().availableMotoboys);
      av.add(order.motoboy.id);
      set({ availableMotoboys: av });
    }
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status: next,
              closedAt: closed,
              timeline: [...o.timeline, { status: next, timestamp: new Date() }],
            }
          : o
      ),
    });
  },

  cancelOrder: (id) =>
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, status: "cancelled", closedAt: new Date(), timeline: [...o.timeline, { status: "cancelled", timestamp: new Date() }] }
          : o
      ),
    }),

  markDelivered: (id) =>
    set({
      orders: get().orders.map((o) =>
        o.id === id
          ? { ...o, status: "delivered", closedAt: new Date(), timeline: [...o.timeline, { status: "delivered", timestamp: new Date() }] }
          : o
      ),
    }),

  addMotoboy: (data) => {
    const initials = data.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const newMotoboy: FlowMotoboy = {
      ...data,
      id: `m${Date.now()}`,
      avatar: initials,
    };
    set({ motoboys: [...get().motoboys, newMotoboy] });
  },

  updateMotoboy: (id, data) =>
    set({
      motoboys: get().motoboys.map((m) => m.id === id ? { ...m, ...data } : m),
    }),

  removeMotoboy: (id) => {
    const av = new Set(get().availableMotoboys);
    av.delete(id);
    set({
      motoboys: get().motoboys.filter((m) => m.id !== id),
      availableMotoboys: av,
    });
  },

  resetOrders: () => {
    _counter = 30;
    set({ orders: [], availableMotoboys: new Set(["m1", "m2", "m3"]) });
  },
}), {
  name: "foodflow-orders",
  storage: makePersistStorage<FlowStore>(),
  partialize: (state) => ({
    orders: state.orders,
    motoboys: state.motoboys,
    availableMotoboys: Array.from(state.availableMotoboys) as unknown as Set<string>,
  }),
  merge: (persisted, current) => {
    const p = persisted as { orders: FlowOrder[]; motoboys: FlowMotoboy[]; availableMotoboys: string[] };
    const orders = p.orders ?? current.orders;
    if (orders.length > 0) {
      _counter = Math.max(_counter, ...orders.map((o) => o.number));
    }
    return {
      ...current,
      orders,
      motoboys: p.motoboys ?? current.motoboys,
      availableMotoboys: new Set<string>(p.availableMotoboys ?? []),
    };
  },
}));
