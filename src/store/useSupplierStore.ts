import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export interface Supplier {
  id:       string;
  name:     string;
  contact:  string;  // nome do responsável
  phone:    string;
  email:    string;
  category: string;  // ex: Frigorífico, Distribuidora, Hortifruti
  notes:    string;
}

interface SupplierStore {
  suppliers: Supplier[];
  add:    (data: Omit<Supplier, "id">) => void;
  update: (id: string, data: Partial<Omit<Supplier, "id">>) => void;
  remove: (id: string) => void;
}

const seed: Supplier[] = [
  { id: "sup1", name: "Frigorífico ABC",   contact: "Roberto Alves",   phone: "(11) 3333-1111", email: "vendas@frigabc.com.br",   category: "Frigorífico",   notes: "Entrega às terças e sextas. Prazo 30 dias." },
  { id: "sup2", name: "Distribuidora XYZ", contact: "Paula Mendes",    phone: "(11) 3333-2222", email: "comercial@distxyz.com.br", category: "Distribuidora", notes: "Pedido mínimo R$ 200. Entrega em 2 dias úteis." },
  { id: "sup3", name: "Hortifruti Local",  contact: "João Pereira",    phone: "(11) 99888-3333", email: "",                         category: "Hortifruti",    notes: "Entrega diária. Pagamento na entrega." },
  { id: "sup4", name: "Padaria Central",   contact: "Ana Costa",       phone: "(11) 3333-4444", email: "contato@padariacentral.com", category: "Padaria",      notes: "Entrega todos os dias às 6h." },
  { id: "sup5", name: "Embalagens & Cia",  contact: "Carlos Rocha",    phone: "(11) 3333-5555", email: "vendas@embalacias.com.br",  category: "Embalagens",    notes: "Compra mínima 500 unidades." },
  { id: "sup6", name: "Atacadão",          contact: "Compras diretas", phone: "",               email: "",                         category: "Atacado",       notes: "Compra presencial." },
];

export const useSupplierStore = create<SupplierStore>()(
  persist(
    (set, get) => ({
      suppliers: seed,
      add: (data) =>
        set({ suppliers: [...get().suppliers, { ...data, id: `sup${Date.now()}` }] }),
      update: (id, data) =>
        set({ suppliers: get().suppliers.map((s) => s.id === id ? { ...s, ...data } : s) }),
      remove: (id) =>
        set({ suppliers: get().suppliers.filter((s) => s.id !== id) }),
    }),
    { name: "foodflow-suppliers", storage: makePersistStorage<SupplierStore>() }
  )
);
