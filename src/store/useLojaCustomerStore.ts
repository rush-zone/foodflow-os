import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "@/lib/storage";

export interface SavedAddress {
  street:       string;
  number:       string;
  neighborhood: string;
  complement:   string;
  cep:          string;
  lat?:         number;
  lng?:         number;
}

export interface CustomerAccount {
  id:             string;
  name:           string;
  email:          string;
  phone:          string;
  password:       string; // plaintext — demo only
  activeOrderId?: string;
  savedAddress?:  SavedAddress;
  createdAt:      string; // ISO string
}

export type AuthError =
  | "email_taken"
  | "phone_taken"
  | "invalid_credentials"
  | "user_not_found";

interface LojaCustomerStore {
  accounts: CustomerAccount[];
  session:  CustomerAccount | null;

  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => { ok: true; account: CustomerAccount } | { ok: false; error: AuthError };

  login: (
    credential: string,   // email OR phone
    password:   string
  ) => { ok: true } | { ok: false; error: AuthError };

  logout: () => void;

  setActiveOrder: (orderId: string) => void;
  saveAddress:    (addr: SavedAddress) => void;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export const useLojaCustomerStore = create<LojaCustomerStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      session:  null,

      register({ name, email, phone, password }) {
        const { accounts } = get();
        const normEmail = normalize(email);
        const normPhone = phone.trim().replace(/\D/g, "");

        if (accounts.some((a) => normalize(a.email) === normEmail))
          return { ok: false, error: "email_taken" };
        if (accounts.some((a) => a.phone.replace(/\D/g, "") === normPhone))
          return { ok: false, error: "phone_taken" };

        const account: CustomerAccount = {
          id:        crypto.randomUUID(),
          name:      name.trim(),
          email:     normEmail,
          phone:     phone.trim(),
          password,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ accounts: [...s.accounts, account], session: account }));
        return { ok: true, account };
      },

      login(credential, password) {
        const { accounts } = get();
        const norm = normalize(credential);
        const normDigits = credential.trim().replace(/\D/g, "");

        const found = accounts.find(
          (a) =>
            normalize(a.email) === norm ||
            a.phone.replace(/\D/g, "") === normDigits
        );

        if (!found)  return { ok: false, error: "user_not_found" };
        if (found.password !== password)
          return { ok: false, error: "invalid_credentials" };

        // Re-read from accounts so we always have fresh data
        set((s) => ({
          session: s.accounts.find((a) => a.id === found.id) ?? found,
        }));
        return { ok: true };
      },

      logout() {
        set({ session: null });
      },

      setActiveOrder(orderId) {
        set((s) => {
          if (!s.session) return s;
          const updated = { ...s.session, activeOrderId: orderId };
          return {
            session:  updated,
            accounts: s.accounts.map((a) =>
              a.id === updated.id ? updated : a
            ),
          };
        });
      },

      saveAddress(addr) {
        set((s) => {
          if (!s.session) return s;
          const updated = { ...s.session, savedAddress: addr };
          return {
            session:  updated,
            accounts: s.accounts.map((a) =>
              a.id === updated.id ? updated : a
            ),
          };
        });
      },
    }),
    {
      name:    "foodflow-loja-customer-v2",
      storage: makePersistStorage<LojaCustomerStore>(),
    }
  )
);
