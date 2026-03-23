"use client";

import Image from "next/image";
import { Product } from "@/types";
import { useOrderStore } from "@/store/useOrderStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useOrderStore((s) => s.addItem);
  const items = useOrderStore((s) => s.items);
  const qty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  return (
    <button
      onClick={() => addItem(product)}
      disabled={!product.available}
      className="group relative bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-brand-primary/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-card-hover text-left"
    >
      {/* Image */}
      <div className="relative h-28 w-full overflow-hidden bg-neutral-700">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {product.popular && (
          <span className="absolute top-2 left-2 bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
            🔥 Popular
          </span>
        )}
        {qty > 0 && (
          <span className="absolute top-2 right-2 bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-fade-in">
            {qty}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-100 leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-brand-primary font-bold text-sm">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-neutral-600 text-xs group-hover:text-brand-primary transition-colors">
            + add
          </span>
        </div>
      </div>
    </button>
  );
}
