import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";
import { StockLink } from "@/types";

export type StockCategory = "carnes" | "bebidas" | "vegetais" | "massas" | "embalagens" | "temperos";

export type StockStatus = "ok" | "low" | "critical" | "out";

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  unit: string;
  quantity: number;
  minQuantity: number;
  idealQuantity: number;
  cost: number; // per unit
  supplier: string;
  lastUpdated: Date;
}

export interface RestockRecord {
  id:        string;
  itemId:    string;
  itemName:  string;
  supplier:  string;
  qty:       number;
  unit:      string;
  unitCost:  number;
  totalCost: number;
  date:      Date;
}

interface EstoqueStore {
  items: StockItem[];
  restockHistory: RestockRecord[];

  adjust:  (id: string, delta: number) => void;
  restock: (id: string) => RestockRecord | null; // retorna registro com custo para exibição
  addItem: (data: Omit<StockItem, "id" | "lastUpdated">) => void;
  deductForSale: (sold: Array<{
    stockLinks?: StockLink[];
    quantity: number;
    extras?: Array<{ stockLinks?: StockLink[] }>;
  }>) => void;
}

function status(item: StockItem): StockStatus {
  if (item.quantity === 0) return "out";
  if (item.quantity <= item.minQuantity * 0.5) return "critical";
  if (item.quantity <= item.minQuantity) return "low";
  return "ok";
}

export { status as getStockStatus };

const now = new Date();

const mockItems: StockItem[] = [
  { id: "s1",  name: "Blend Bovino 180g",    category: "carnes",     unit: "un",  quantity: 42,  minQuantity: 20, idealQuantity: 100, cost: 8.50,  supplier: "Frigorífico ABC", lastUpdated: now },
  { id: "s2",  name: "Frango Peito",          category: "carnes",     unit: "kg",  quantity: 8,   minQuantity: 5,  idealQuantity: 20,  cost: 18.0,  supplier: "Frigorífico ABC", lastUpdated: now },
  { id: "s3",  name: "Bacon Fatiado",         category: "carnes",     unit: "kg",  quantity: 3,   minQuantity: 4,  idealQuantity: 10,  cost: 32.0,  supplier: "Frigorífico ABC", lastUpdated: now },
  { id: "s4",  name: "Coca-Cola Lata 350ml",  category: "bebidas",    unit: "un",  quantity: 144, minQuantity: 48, idealQuantity: 200, cost: 2.80,  supplier: "Distribuidora XYZ", lastUpdated: now },
  { id: "s5",  name: "Suco de Laranja Natural",category: "bebidas",   unit: "L",   quantity: 12,  minQuantity: 8,  idealQuantity: 30,  cost: 6.0,   supplier: "Hortifruti Local", lastUpdated: now },
  { id: "s6",  name: "Água Mineral 500ml",    category: "bebidas",    unit: "un",  quantity: 0,   minQuantity: 24, idealQuantity: 72,  cost: 1.20,  supplier: "Distribuidora XYZ", lastUpdated: now },
  { id: "s7",  name: "Alface Americana",      category: "vegetais",   unit: "un",  quantity: 6,   minQuantity: 5,  idealQuantity: 20,  cost: 3.5,   supplier: "Hortifruti Local", lastUpdated: now },
  { id: "s8",  name: "Tomate",                category: "vegetais",   unit: "kg",  quantity: 4,   minQuantity: 3,  idealQuantity: 10,  cost: 8.0,   supplier: "Hortifruti Local", lastUpdated: now },
  { id: "s9",  name: "Cebola",                category: "vegetais",   unit: "kg",  quantity: 7,   minQuantity: 4,  idealQuantity: 15,  cost: 5.0,   supplier: "Hortifruti Local", lastUpdated: now },
  { id: "s10", name: "Massa para Pizza",      category: "massas",     unit: "kg",  quantity: 15,  minQuantity: 10, idealQuantity: 30,  cost: 12.0,  supplier: "Padaria Central", lastUpdated: now },
  { id: "s11", name: "Pão Brioche",           category: "massas",     unit: "un",  quantity: 38,  minQuantity: 20, idealQuantity: 80,  cost: 1.80,  supplier: "Padaria Central", lastUpdated: now },
  { id: "s12", name: "Embalagem Delivery P",  category: "embalagens", unit: "un",  quantity: 200, minQuantity: 50, idealQuantity: 300, cost: 0.45,  supplier: "Embalagens & Cia", lastUpdated: now },
  { id: "s13", name: "Embalagem Delivery G",  category: "embalagens", unit: "un",  quantity: 18,  minQuantity: 30, idealQuantity: 150, cost: 0.80,  supplier: "Embalagens & Cia", lastUpdated: now },
  { id: "s14", name: "Sal",                   category: "temperos",   unit: "kg",  quantity: 5,   minQuantity: 2,  idealQuantity: 8,   cost: 2.5,   supplier: "Atacadão", lastUpdated: now },
  { id: "s15", name: "Cheddar Fatiado",       category: "carnes",     unit: "kg",  quantity: 2,   minQuantity: 3,  idealQuantity: 10,  cost: 45.0,  supplier: "Frigorífico ABC", lastUpdated: now },
  { id: "s16", name: "Maionese da Casa",    category: "temperos",   unit: "kg",  quantity: 2,  minQuantity: 1,  idealQuantity: 5,  cost: 15.0,  supplier: "Atacadão",       lastUpdated: now },
  { id: "s17", name: "Ketchup Especial",    category: "temperos",   unit: "kg",  quantity: 1,  minQuantity: 0.5,idealQuantity: 3,  cost: 12.0,  supplier: "Atacadão",       lastUpdated: now },
];

export const useEstoqueStore = create<EstoqueStore>()(persist((set, get) => ({
  items: mockItems,
  restockHistory: [],

  adjust: (id, delta) =>
    set({
      items: get().items.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(0, i.quantity + delta), lastUpdated: new Date() }
          : i
      ),
    }),

  restock: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return null;
    const qty = Math.max(0, item.idealQuantity - item.quantity);
    if (qty === 0) return null;
    const record: RestockRecord = {
      id:        `r${Date.now()}`,
      itemId:    item.id,
      itemName:  item.name,
      supplier:  item.supplier,
      qty,
      unit:      item.unit,
      unitCost:  item.cost,
      totalCost: qty * item.cost,
      date:      new Date(),
    };
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, quantity: i.idealQuantity, lastUpdated: new Date() } : i
      ),
      restockHistory: [record, ...get().restockHistory],
    });
    return record;
  },

  addItem: (data) =>
    set({
      items: [
        ...get().items,
        { ...data, id: `s${Date.now()}`, lastUpdated: new Date() },
      ],
    }),

  deductForSale: (sold) => {
    const deductions = new Map<string, number>();
    for (const { stockLinks, quantity, extras } of sold) {
      // Produto base
      for (const link of stockLinks ?? []) {
        deductions.set(link.stockId, (deductions.get(link.stockId) ?? 0) + link.qty * quantity);
      }
      // Adicionais escolhidos pelo cliente
      for (const extra of extras ?? []) {
        for (const link of extra.stockLinks ?? []) {
          deductions.set(link.stockId, (deductions.get(link.stockId) ?? 0) + link.qty * quantity);
        }
      }
    }
    if (deductions.size === 0) return;
    set({
      items: get().items.map((item) => {
        const delta = deductions.get(item.id);
        if (delta === undefined) return item;
        return { ...item, quantity: Math.max(0, item.quantity - delta), lastUpdated: new Date() };
      }),
    });
  },
}), {
  name: "foodflow-estoque",
  storage: makePersistStorage<EstoqueStore>(),
  merge: (persisted: unknown, current) => {
    const p = persisted as Partial<EstoqueStore>;
    return {
      ...current,
      ...(p ?? {}),
      restockHistory: p?.restockHistory ?? [],
    };
  },
}));
