"use client";

import Image from "next/image";
import { useUpsell } from "@/hooks/useUpsell";
import { useOrderStore } from "@/store/useOrderStore";

export default function UpsellSuggestions() {
  const { suggestions } = useUpsell();
  const addItem = useOrderStore((s) => s.addItem);

  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-neutral-800 px-4 py-3 shrink-0">
      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
        <span>✨</span>
        <span>Adicionar também?</span>
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {suggestions.map((product) => (
          <button
            key={product.id}
            onClick={() => addItem(product)}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-brand-primary/40 rounded-xl px-3 py-2 shrink-0 transition-all group"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-neutral-200 leading-tight line-clamp-1 max-w-[90px]">
                {product.name}
              </p>
              <p className="text-xs text-brand-primary font-bold">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <span className="text-neutral-600 group-hover:text-brand-primary text-sm transition-colors ml-1">+</span>
          </button>
        ))}
      </div>
    </div>
  );
}
