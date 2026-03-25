import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export type KitchenFlow = "normal" | "alto";

export const FLOW_META: Record<KitchenFlow, { label: string; color: string; bg: string; icon: string }> = {
  normal: { label: "Fluxo Normal", color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30",  icon: "🟢" },
  alto:   { label: "Fluxo Alto",   color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", icon: "🔴" },
};

/** Formata minutos como "30 min", "1h", "1h 30 min" */
export function fmtMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h   = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem} min`;
}

interface KitchenStore {
  flow: KitchenFlow;
  setFlow: (f: KitchenFlow) => void;
}

export const useKitchenStore = create<KitchenStore>()(persist(
  (set) => ({
    flow: "normal",
    setFlow: (flow) => set({ flow }),
  }),
  { name: "foodflow-kitchen", storage: makePersistStorage<KitchenStore>() }
));
