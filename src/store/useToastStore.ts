import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  add: (toast) => {
    const id = `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
    setTimeout(() => get().remove(id), 3500);
  },

  remove: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Convenience helpers — call from anywhere without hook rules
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "success", title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "error", title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "info", title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "warning", title, message }),
};
