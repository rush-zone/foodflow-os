import { create } from "zustand";
import { Product, Category } from "@/types";
import { products as seedProducts, categories as seedCategories } from "@/data/products";

interface MenuStore {
  products: Product[];
  categories: Category[];

  toggleAvailability: (id: string) => void;
  togglePopular: (id: string) => void;
  updateProduct: (id: string, data: Partial<Omit<Product, "id">>) => void;
  addProduct: (data: Omit<Product, "id">) => void;
  deleteProduct: (id: string) => void;
  addCategory: (data: Omit<Category, "id">) => void;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  products: seedProducts,
  categories: seedCategories,

  toggleAvailability: (id) =>
    set({
      products: get().products.map((p) =>
        p.id === id ? { ...p, available: !p.available } : p
      ),
    }),

  togglePopular: (id) =>
    set({
      products: get().products.map((p) =>
        p.id === id ? { ...p, popular: !p.popular } : p
      ),
    }),

  updateProduct: (id, data) =>
    set({
      products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }),

  addProduct: (data) =>
    set({
      products: [
        ...get().products,
        { ...data, id: `p${Date.now()}` },
      ],
    }),

  deleteProduct: (id) =>
    set({ products: get().products.filter((p) => p.id !== id) }),

  addCategory: (data) =>
    set({
      categories: [
        ...get().categories,
        { ...data, id: `cat${Date.now()}` },
      ],
    }),
}));
