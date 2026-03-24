"use client";

import { useState, useMemo } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import CategoryTabs from "./CategoryTabs";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";

export default function CatalogPanel() {
  const products   = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.available) return false;
      const matchCategory =
        activeCategory === "all" || p.category === activeCategory;
      const matchSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Category tabs */}
      <div className="shrink-0">
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pt-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
