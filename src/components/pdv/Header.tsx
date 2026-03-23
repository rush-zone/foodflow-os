"use client";

import { useOrderStore } from "@/store/useOrderStore";

export default function Header() {
  const itemCount = useOrderStore((s) => s.itemCount());

  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
          FF
        </div>
        <div>
          <span className="font-bold text-white text-sm">FoodFlow OS</span>
          <span className="ml-2 text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
            PDV
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-neutral-400">
        <span>Mesa 01</span>
        <span>Operador: Admin</span>
        <div className="text-right">
          <div className="text-white font-medium">{time}</div>
          <div className="text-xs text-neutral-500 capitalize">{date}</div>
        </div>
        {itemCount > 0 && (
          <div className="flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
              {itemCount}
            </span>
            itens no pedido
          </div>
        )}
      </div>
    </header>
  );
}
