"use client";

import { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  active,
  onChange,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-thin">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            active === cat.id
              ? "bg-brand-primary text-white shadow-lg"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
