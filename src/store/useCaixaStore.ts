import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";
import type { OperatorRole } from "./useAuthStore";

export type MovementType = "suprimento" | "sangria";

export interface CaixaMovement {
  id: string;
  type: MovementType;
  amount: number;
  note: string;
  at: Date;
  auto?: boolean; // true = gerado automaticamente (ex: venda em dinheiro)
}

export interface CaixaAuditEntry {
  id: string;
  at: Date;
  action: "open" | "close" | "suprimento" | "sangria" | "override";
  performedBy: string;
  role: OperatorRole;
  note?: string;
  amount?: number;
}

interface CaixaStore {
  isOpen: boolean;
  openedAt: Date | null;
  operator: string;
  openingBalance: number;
  movements: CaixaMovement[];
  auditLog: CaixaAuditEntry[];

  open: (operator: string, balance: number) => void;
  addMovement: (type: MovementType, amount: number, note: string, auto?: boolean) => void;
  close: () => void;
  addAuditEntry: (entry: Omit<CaixaAuditEntry, "id" | "at">) => void;
}

export const useCaixaStore = create<CaixaStore>()(persist((set, get) => ({
  isOpen: false,
  openedAt: null,
  operator: "",
  openingBalance: 0,
  movements: [],
  auditLog: [],

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

  addAuditEntry: (entry) =>
    set({
      auditLog: [
        ...get().auditLog,
        { id: `a${Date.now()}`, at: new Date(), ...entry },
      ],
    }),
}), { name: "foodflow-caixa", storage: makePersistStorage<CaixaStore>() }));
