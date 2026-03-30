import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type OperatorRole = "admin" | "gerente" | "atendente" | "caixa" | "cozinha";

export const ROLE_LABEL: Record<OperatorRole, string> = {
  admin:     "Administrador",
  gerente:   "Gerente",
  atendente: "Atendente",
  caixa:     "Operador de Caixa",
  cozinha:   "Cozinha",
};

export interface Operator {
  id: string;
  name: string;
  role: OperatorRole;
  avatar: string;
}

// Rotas permitidas por função
export const ROLE_ROUTES: Record<OperatorRole, string[]> = {
  admin:     ["/", "/kds", "/delivery", "/hub", "/estoque", "/analytics", "/crm", "/multiunit", "/cardapio", "/caixa", "/configuracoes", "/loja"],
  gerente:   ["/", "/kds", "/delivery", "/hub", "/estoque", "/analytics", "/crm", "/multiunit", "/cardapio", "/caixa", "/configuracoes", "/loja"],
  atendente: ["/", "/kds", "/delivery", "/hub", "/estoque", "/crm", "/cardapio", "/loja"],
  caixa:     ["/", "/kds", "/delivery", "/hub", "/estoque", "/crm", "/cardapio", "/caixa", "/loja"],
  cozinha:   ["/kds"],
};

// Rota inicial de cada função após login
export const ROLE_HOME: Record<OperatorRole, string> = {
  admin:     "/",
  gerente:   "/",
  atendente: "/",
  caixa:     "/",
  cozinha:   "/kds",
};

export function canAccess(role: OperatorRole, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role];
  return allowed.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

// Operadores cadastrados no sistema
export const SYSTEM_OPERATORS: Operator[] = [
  { id: "op1", name: "João Silva",    role: "gerente",   avatar: "JS" },
  { id: "op2", name: "Maria Santos",  role: "caixa",     avatar: "MS" },
  { id: "op3", name: "Carlos Lima",   role: "atendente", avatar: "CL" },
  { id: "op4", name: "Ana Beatriz",   role: "cozinha",   avatar: "AB" },
  { id: "op5", name: "Admin",         role: "admin",     avatar: "AD" },
];

interface AuthStore {
  operator: Operator | null;
  _hasHydrated: boolean;
  login: (operator: Operator) => void;
  logout: () => void;
  _setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      operator: null,
      _hasHydrated: false,
      login:  (operator) => set({ operator }),
      logout: () => set({ operator: null }),
      _setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: "foodflow-auth-v2",
      storage: makePersistStorage<AuthStore>(),
      onRehydrateStorage: () => (state) => { state?._setHydrated(); },
    }
  )
);
