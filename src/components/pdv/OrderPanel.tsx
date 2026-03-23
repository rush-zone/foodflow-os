"use client";

import { useOrderStore } from "@/store/useOrderStore";
import OrderItem from "./OrderItem";
import UpsellSuggestions from "./UpsellSuggestions";
import ComboDetector from "./ComboDetector";

export default function OrderPanel() {
  const items = useOrderStore((s) => s.items);
  const clearOrder = useOrderStore((s) => s.clearOrder);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-neutral-100">Pedido</h2>
          <p className="text-xs text-neutral-500">
            {items.length === 0
              ? "Nenhum item"
              : `${items.length} ${items.length === 1 ? "item" : "itens"}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearOrder}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 px-4 text-center">
            <span className="text-4xl mb-3">🛒</span>
            <p className="text-sm font-medium">Pedido vazio</p>
            <p className="text-xs mt-1">Selecione produtos no catálogo</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {items.map((item) => (
              <OrderItem key={item.product.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Combo detector */}
      <ComboDetector />

      {/* Upsell suggestions */}
      <UpsellSuggestions />
    </div>
  );
}
