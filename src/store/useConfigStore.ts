import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type AppPlan = "starter" | "pro" | "growth" | "enterprise";

export const PLAN_LABELS: Record<AppPlan, string> = {
  starter:    "Starter",
  pro:        "Pro",
  growth:     "Growth",
  enterprise: "Enterprise",
};

export const PLAN_PRICES: Record<AppPlan, string> = {
  starter:    "R$149/mês",
  pro:        "R$297/mês",
  growth:     "R$497/mês",
  enterprise: "R$800+/mês",
};

// Features disponíveis por plano (cumulativo)
export const PLAN_FEATURES: Record<string, AppPlan> = {
  pdv:          "starter",
  kds:          "starter",
  hub:          "starter",
  caixa:        "starter",
  estoque:      "starter",
  configuracoes:"starter",
  crm:          "pro",
  analytics:    "pro",
  multiunit:    "growth",
  flowstore:    "growth",
  whitelabel:   "enterprise",
};

const PLAN_ORDER: AppPlan[] = ["starter", "pro", "growth", "enterprise"];

export function planIncludes(currentPlan: AppPlan, requiredPlan: AppPlan): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

export interface AppConfig {
  restaurant: {
    name: string;
    address: string;
    phone: string;
    cnpj: string;
    logoUrl: string;
  };
  delivery: {
    fee: number;
    freeAbove: number;       // frete grátis acima de R$
    estimatedMinutes: number;
    radiusKm: number;
    flowMinutes: {
      normal: { min: number; max: number }; // ex: 30–60 min
      alto:   { min: number; max: number }; // ex: 60–120 min
    };
  };
  operation: {
    serviceChargePct: number; // % taxa de serviço (0 = desabilitado)
    comboDiscountPct: number; // % desconto automático combo
    allowManualDiscount: boolean;
  };
  receipt: {
    showLogo: boolean;
    footer: string;
  };
}

const defaults: AppConfig = {
  restaurant: {
    name: "FoodFlow Burger",
    address: "Rua das Flores, 123 — Centro",
    phone: "(11) 3000-0000",
    cnpj: "00.000.000/0001-00",
    logoUrl: "",
  },
  delivery: {
    fee: 5.9,
    freeAbove: 80,
    estimatedMinutes: 45,
    radiusKm: 5,
    flowMinutes: {
      normal: { min: 30, max: 60 },
      alto:   { min: 60, max: 120 },
    },
  },
  operation: {
    serviceChargePct: 0,
    comboDiscountPct: 10,
    allowManualDiscount: true,
  },
  receipt: {
    showLogo: true,
    footer: "Obrigado pela preferência! Volte sempre 😊",
  },
};

interface ConfigStore {
  config: AppConfig;
  plan: AppPlan;
  update: (patch: Partial<AppConfig>) => void;
  updateSection: <K extends keyof AppConfig>(section: K, patch: Partial<AppConfig[K]>) => void;
  setPlan: (plan: AppPlan) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: defaults,
      plan: "growth" as AppPlan, // demo começa no Growth para mostrar tudo

      update: (patch) =>
        set({ config: { ...get().config, ...patch } }),

      updateSection: (section, patch) =>
        set({
          config: {
            ...get().config,
            [section]: { ...get().config[section], ...patch },
          },
        }),

      setPlan: (plan) => set({ plan }),

      reset: () => set({ config: defaults }),
    }),
    { name: "foodflow-config", storage: makePersistStorage<ConfigStore>() }
  )
);
