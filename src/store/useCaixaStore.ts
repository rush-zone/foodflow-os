import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type MovementType = "suprimento" | "sangria";

export interface CaixaMovement {
  id: string;
  type: MovementType;
  amount: number;
  note: string;
  at: Date;
  auto?: boolean; // true = gerado automaticamente (ex: venda em dinheiro)
}

interface CaixaStore {
  isOpen: boolean;
  openedAt: Date | null;
  operator: string;
  openingBalance: number;
  movements: CaixaMovement[];

  open: (operator: string, balance: number) => void;
  addMovement: (type: MovementType, amount: number, note: string, auto?: boolean) => void;
  close: () => void;
}

export const useCaixaStore = create<CaixaStore>()(persist((set, get) => ({
  isOpen: false,
  openedAt: null,
  operator: "",
  openingBalance: 0,
  movements: [],

  open: (operator, balance) =>
    set({ isOpen: true, openedAt: new Date(), operator, openingBalance: balance, movements: [] }),

  addMovement: (type, amount, note, auto = false) =>
    set({
      movements: [
        ...get().movements,
        { id: `m${Date.now()}`, type, amount, note, at: new Date(), auto },
      ],
    }),

  close: () =>
    set({ isOpen: false, openedAt: null, operator: "", openingBalance: 0, movements: [] }),
}), { name: "foodflow-caixa", storage: makePersistStorage<CaixaStore>() }));
