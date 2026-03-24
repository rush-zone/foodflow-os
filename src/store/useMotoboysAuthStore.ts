import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";
import { FlowMotoboy } from "@/store/useFlowStore";

interface MotoboysAuthStore {
  currentMotoboy: FlowMotoboy | null;
  loginAs: (motoboy: FlowMotoboy) => void;
  logout: () => void;
}

export const useMotoboysAuthStore = create<MotoboysAuthStore>()(
  persist(
    (set) => ({
      currentMotoboy: null,
      loginAs: (motoboy) => set({ currentMotoboy: motoboy }),
      logout: () => set({ currentMotoboy: null }),
    }),
    { name: "foodflow-motoboy-auth", storage: makePersistStorage<MotoboysAuthStore>() }
  )
);
