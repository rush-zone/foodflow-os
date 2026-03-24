import type { PersistStorage, StorageValue } from "zustand/middleware";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function dateReviver(_k: string, v: unknown): unknown {
  if (typeof v === "string" && ISO_DATE_RE.test(v)) return new Date(v);
  return v;
}

export function makePersistStorage<T>(): PersistStorage<T> {
  return {
    getItem(name: string): StorageValue<T> | null {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw, dateReviver) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem(name: string, value: StorageValue<T>): void {
      if (typeof window !== "undefined") {
        localStorage.setItem(name, JSON.stringify(value));
      }
    },
    removeItem(name: string): void {
      if (typeof window !== "undefined") {
        localStorage.removeItem(name);
      }
    },
  };
}
