"use client";

import { OrderItem as OrderItemType } from "@/types";
import { useOrderStore } from "@/store/useOrderStore";

interface OrderItemProps {
  item: OrderItemType;
}

export default function OrderItem({ item }: OrderItemProps) {
  const updateQuantity = useOrderStore((s) => s.updateQuantity);
  const removeItem = useOrderStore((s) => s.removeItem);

  return (
    <div className="px-4 py-3 animate-slide-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-100 leading-tight line-clamp-1">
            {item.product.name}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            R$ {item.product.price.toFixed(2).replace(".", ",")} un.
          </p>
        </div>

        <button
          onClick={() => removeItem(item.product.id)}
          className="text-neutral-600 hover:text-red-400 transition-colors mt-0.5 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {/* Quantity control */}
        <div className="flex items-center gap-2 bg-neutral-900 rounded-lg p-0.5">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 text-neutral-300 flex items-center justify-center text-sm font-bold transition-colors"
          >
            −
          </button>
          <span className="text-sm font-bold text-neutral-100 w-6 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="w-6 h-6 rounded-md bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            +
          </button>
        </div>

        <span className="text-sm font-bold text-brand-primary">
          R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
        </span>
      </div>
    </div>
  );
}
