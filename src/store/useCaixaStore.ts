import { create } from "zustand";

export type MovementType = "suprimento" | "sangria";

export interface CaixaMovement {
  id: string;
  type: MovementType;
  amount: number;
  note: string;
  at: Date;
}

interface CaixaStore {
  isOpen: boolean;
  openedAt: Date | null;
  operator: string;
  openingBalance: number;
  movements: CaixaMovement[];

  open: (operator: string, balance: number) => void;
  addMovement: (type: MovementType, amount: number, note: string) => void;
  close: () => void;
}

export const useCaixaStore = create<CaixaStore>((set, get) => ({
  isOpen: false,
  openedAt: null,
  operator: "",
  openingBalance: 0,
  movements: [],

  open: (operator, balance) =>
    set({ isOpen: true, openedAt: new Date(), operator, openingBalance: balance, movements: [] }),

  addMovement: (type, amount, note) =>
    set({
      movements: [
        ...get().movements,
        { id: `m${Date.now()}`, type, amount, note, at: new Date() },
      ],
    }),

  close: () =>
    set({ isOpen: false, openedAt: null, operator: "", openingBalance: 0, movements: [] }),
}));
