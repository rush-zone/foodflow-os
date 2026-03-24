import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

interface AuthStore {
  operator: string | null;
  login: (operator: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      operator: null,
      login: (operator) => set({ operator }),
      logout: () => set({ operator: null }),
    }),
    { name: "foodflow-auth", storage: makePersistStorage<AuthStore>() }
  )
);
