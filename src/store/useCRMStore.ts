import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type CustomerTag = "vip" | "recorrente" | "novo" | "inativo";
export type MessageStatus = "sent" | "delivered" | "read";
export type MessageFrom = "customer" | "restaurant";

export interface CRMMessage {
  id: string;
  from: MessageFrom;
  text: string;
  timestamp: Date;
  status: MessageStatus;
}

export interface CRMOrder {
  id: string;
  number: number;
  date: Date;
  total: number;
  items: string[];
  status: string;
}

export type AddressType = "casa" | "apartamento";

export interface CRMCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  tags: CustomerTag[];
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastOrderAt: Date;
  favoriteItems: string[];
  orders: CRMOrder[];
  messages: CRMMessage[];
  unread: number;
  notes: string;
  // Endereço
  address?: string;         // rua + número de rua
  neighborhood?: string;    // bairro
  addressNumber?: string;   // número da residência
  addressType?: AddressType; // casa ou apartamento
  addressComplement?: string; // apto, bloco, etc.
}

export interface MessageTemplate {
  id: string;
  label: string;
  text: string;
  emoji: string;
}

interface CRMStore {
  customers: CRMCustomer[];
  selectedId: string | null;
  select: (id: string) => void;
  sendMessage: (customerId: string, text: string) => void;
  markRead: (customerId: string) => void;
  updateNotes: (customerId: string, notes: string) => void;
  updateCustomer: (id: string, data: Partial<CRMCustomer>) => void;
  addCustomer: (data: Pick<CRMCustomer,
    "name" | "phone" | "email" | "tags" |
    "address" | "neighborhood" | "addressNumber" | "addressType" | "addressComplement"
  >) => void;
  /**
   * Cadastra ou atualiza pelo número de telefone.
   * Se já existir um cliente com o mesmo telefone, atualiza nome/endereço.
   * Garante que cadastro via web e via PDV/atendente não dupliquem o mesmo cliente.
   */
  upsertCustomer: (data: Pick<CRMCustomer,
    "name" | "phone" | "email" | "tags" |
    "address" | "neighborhood" | "addressNumber" | "addressType" | "addressComplement"
  >) => void;
  templates: MessageTemplate[];
}

const now = Date.now();
const d = (m: number) => new Date(now - m * 60000);
const ds = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

const makeId = () => Math.random().toString(36).slice(2);

const customers: CRMCustomer[] = [
  {
    id: "c1",
    name: "Ana Beatriz",
    phone: "(11) 98765-4321",
    avatar: "AB",
    tags: ["vip", "recorrente"],
    totalOrders: 24,
    totalSpent: 1842.6,
    avgTicket: 76.8,
    lastOrderAt: d(32),
    favoriteItems: ["Double Smash", "Batata Frita G", "Coca-Cola"],
    notes: "Prefere sem cebola. Sempre pede pelo iFood.",
    unread: 2,
    orders: [
      { id: "o1", number: 42, date: d(32),    total: 76.8,  items: ["Double Smash", "Batata Frita G"], status: "A Caminho" },
      { id: "o2", number: 35, date: ds(3),    total: 92.5,  items: ["Double Smash x2", "Coca-Cola x2"], status: "Entregue" },
      { id: "o3", number: 28, date: ds(7),    total: 64.8,  items: ["Smash Burger", "Batata Frita G"], status: "Entregue" },
    ],
    messages: [
      { id: makeId(), from: "customer",   text: "Oi! Meu pedido já saiu?",                            timestamp: d(15), status: "read" },
      { id: makeId(), from: "restaurant", text: "Oi Ana! Sim, seu pedido está a caminho 🏍️ Chegará em ~20 min!", timestamp: d(14), status: "read" },
      { id: makeId(), from: "customer",   text: "Ótimo, obrigada! 😊",                                timestamp: d(13), status: "read" },
      { id: makeId(), from: "customer",   text: "Ei, tem previsão de promoção pro fim de semana?",    timestamp: d(5),  status: "delivered" },
      { id: makeId(), from: "customer",   text: "Adoro o Double Smash de vocês 🍔",                   timestamp: d(2),  status: "delivered" },
    ],
  },
  {
    id: "c2",
    name: "Pedro Rocha",
    phone: "(11) 91234-5678",
    avatar: "PR",
    tags: ["recorrente"],
    totalOrders: 11,
    totalSpent: 943.8,
    avgTicket: 85.8,
    lastOrderAt: d(18),
    favoriteItems: ["Pizza Pepperoni", "Milkshake"],
    notes: "",
    unread: 0,
    orders: [
      { id: "o4", number: 41, date: d(18),    total: 85.8,  items: ["Pizza Pepperoni", "Milkshake x2"], status: "Em Preparo" },
      { id: "o5", number: 30, date: ds(5),    total: 104.0, items: ["Pizza Pepperoni x2", "Coca-Cola"], status: "Entregue" },
    ],
    messages: [
      { id: makeId(), from: "customer",   text: "Qual o tempo de entrega hoje?",             timestamp: d(20), status: "read" },
      { id: makeId(), from: "restaurant", text: "Oi Pedro! Hoje está ~35-40 min ✅",         timestamp: d(19), status: "read" },
      { id: makeId(), from: "customer",   text: "Beleza, vou pedir!",                         timestamp: d(18), status: "read" },
    ],
  },
  {
    id: "c3",
    name: "Juliana Ferreira",
    phone: "(11) 97777-8888",
    avatar: "JF",
    tags: ["novo"],
    totalOrders: 3,
    totalSpent: 116.7,
    avgTicket: 38.9,
    lastOrderAt: ds(1),
    favoriteItems: ["Smash Burger Clássico", "Suco Natural"],
    notes: "Primeiro pedido foi retirada. Gostou muito.",
    unread: 1,
    orders: [
      { id: "o6", number: 37, date: ds(1),    total: 38.9,  items: ["Smash Burger", "Suco Natural"], status: "Entregue" },
      { id: "o7", number: 22, date: ds(10),   total: 41.8,  items: ["Chicken Crispy", "Batata P"],   status: "Entregue" },
    ],
    messages: [
      { id: makeId(), from: "customer",   text: "Vocês têm opção vegetariana?",              timestamp: d(60), status: "read" },
      { id: makeId(), from: "restaurant", text: "Oi Juliana! Temos Pizza Margherita e saladas 🥗", timestamp: d(58), status: "read" },
      { id: makeId(), from: "customer",   text: "Boa ideia! Vou tentar na próxima 😄",       timestamp: d(57), status: "read" },
      { id: makeId(), from: "customer",   text: "Recomendação de combo para hoje?",          timestamp: d(10), status: "delivered" },
    ],
  },
  {
    id: "c4",
    name: "Marcos Oliveira",
    phone: "(11) 96666-5555",
    avatar: "MO",
    tags: ["vip", "recorrente"],
    totalOrders: 38,
    totalSpent: 4427.0,
    avgTicket: 116.5,
    lastOrderAt: d(65),
    favoriteItems: ["Smash Burger Clássico", "Batata Frita P", "Pizza Pepperoni"],
    notes: "Cliente VIP. Costuma pedir para família toda (3-4 burgers).",
    unread: 0,
    orders: [
      { id: "o8", number: 39, date: d(65),    total: 116.5, items: ["Smash Burger x3", "Batata P x2"], status: "Entregue" },
      { id: "o9", number: 31, date: ds(4),    total: 142.0, items: ["Double Smash x2", "Pizza Pepperoni"], status: "Entregue" },
    ],
    messages: [
      { id: makeId(), from: "restaurant", text: "Oi Marcos! Seu pedido foi entregue 🎉 Obrigado por escolher a gente!", timestamp: d(17), status: "read" },
      { id: makeId(), from: "customer",   text: "Sempre ótimo! Até o próximo 👊",            timestamp: d(15), status: "read" },
    ],
  },
  {
    id: "c5",
    name: "Carlos Lima",
    phone: "(11) 93333-4444",
    avatar: "CL",
    tags: ["inativo"],
    totalOrders: 5,
    totalSpent: 459.0,
    avgTicket: 91.8,
    lastOrderAt: ds(21),
    favoriteItems: ["Double Smash", "Coca-Cola"],
    notes: "Não pede há 3 semanas. Candidato para reativação.",
    unread: 0,
    orders: [
      { id: "o10", number: 35, date: ds(21), total: 91.8,  items: ["Double Smash x2", "Coca-Cola x2"], status: "Entregue" },
    ],
    messages: [
      { id: makeId(), from: "restaurant", text: "Sentimos sua falta, Carlos! 🍔 Que tal um cupom de 10% no próximo pedido?", timestamp: ds(7), status: "read" },
      { id: makeId(), from: "customer",   text: "Que ótimo! Vou usar em breve.",              timestamp: ds(7), status: "read" },
    ],
  },
];

const templates: MessageTemplate[] = [
  { id: "t1", label: "Pedido confirmado",   emoji: "✅", text: "Olá! Seu pedido foi confirmado e já está sendo preparado 🍳 Em breve chegará até você!" },
  { id: "t2", label: "Saiu para entrega",   emoji: "🏍️", text: "Seu pedido saiu para entrega! Em aproximadamente 30 minutos chegará ao seu endereço 🚀" },
  { id: "t3", label: "Pedido entregue",     emoji: "🎉", text: "Pedido entregue! Esperamos que tenha gostado 😊 Avalie-nos no app, sua opinião é muito importante!" },
  { id: "t4", label: "Promoção ativa",      emoji: "🔥", text: "Oi! Hoje temos promoção especial: Combo Clássico com R$ 6 de desconto! Aproveite 🍔🍟" },
  { id: "t5", label: "Reativação VIP",      emoji: "💎", text: "Sentimos sua falta! Como cliente especial, preparamos um cupom exclusivo de 15% off no seu próximo pedido: VOLTEI15" },
  { id: "t6", label: "Feedback",            emoji: "⭐", text: "Obrigado por pedir conosco! Como foi sua experiência? Responda com uma nota de 1 a 5 ⭐" },
  { id: "t7", label: "Atraso na entrega",   emoji: "⏳", text: "Desculpe o atraso! Seu pedido está a caminho e chegará em mais ~15 minutos. Obrigado pela paciência 🙏" },
];

export const useCRMStore = create<CRMStore>()(persist((set, get) => ({
  customers,
  templates,
  selectedId: "c1",

  select: (id) => {
    set({ selectedId: id });
    get().markRead(id);
  },

  sendMessage: (customerId, text) => {
    const msg: CRMMessage = {
      id: makeId(),
      from: "restaurant",
      text,
      timestamp: new Date(),
      status: "sent",
    };
    set({
      customers: get().customers.map((c) =>
        c.id === customerId
          ? { ...c, messages: [...c.messages, msg] }
          : c
      ),
    });
    // Simulate delivered status after 1s
    setTimeout(() => {
      set({
        customers: get().customers.map((c) =>
          c.id === customerId
            ? { ...c, messages: c.messages.map((m) => m.id === msg.id ? { ...m, status: "delivered" } : m) }
            : c
        ),
      });
    }, 1000);
  },

  markRead: (customerId) =>
    set({
      customers: get().customers.map((c) =>
        c.id === customerId ? { ...c, unread: 0 } : c
      ),
    }),

  updateNotes: (customerId, notes) =>
    set({
      customers: get().customers.map((c) =>
        c.id === customerId ? { ...c, notes } : c
      ),
    }),

  updateCustomer: (id, data) =>
    set({
      customers: get().customers.map((c) => c.id === id ? { ...c, ...data } : c),
    }),

  addCustomer: (data) => {
    const initials = data.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const customer: CRMCustomer = {
      id: `c${Date.now()}`,
      avatar: initials,
      tags: data.tags ?? ["novo"],
      totalOrders: 0,
      totalSpent: 0,
      avgTicket: 0,
      lastOrderAt: new Date(),
      favoriteItems: [],
      orders: [],
      messages: [],
      unread: 0,
      notes: "",
      ...data,
    };
    set({ customers: [customer, ...get().customers], selectedId: customer.id });
  },

  upsertCustomer: (data) => {
    const normPhone = data.phone?.replace(/\D/g, "") ?? "";
    const existing = normPhone
      ? get().customers.find((c) => c.phone.replace(/\D/g, "") === normPhone)
      : null;

    if (existing) {
      // Atualiza: preserva histórico e estatísticas, atualiza dados cadastrais
      set({
        customers: get().customers.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                name:              data.name              || c.name,
                address:           data.address           ?? c.address,
                neighborhood:      data.neighborhood      ?? c.neighborhood,
                addressNumber:     data.addressNumber     ?? c.addressNumber,
                addressType:       data.addressType       ?? c.addressType,
                addressComplement: data.addressComplement ?? c.addressComplement,
              }
            : c
        ),
      });
    } else {
      get().addCustomer(data);
    }
  },
}), {
  name: "foodflow-crm",
  storage: makePersistStorage<CRMStore>(),
  partialize: (state) => ({ customers: state.customers, selectedId: state.selectedId }),
}));
