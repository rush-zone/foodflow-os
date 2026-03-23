"use client";

import { useKDSStore, KDSStatus } from "@/store/useKDSStore";
import KDSOrderCard from "./KDSOrderCard";
import { useEffect, useState } from "react";

const columns: { status: KDSStatus; label: string; icon: string; color: string }[] = [
  { status: "new",       label: "Novos",      icon: "🔔", color: "text-blue-400" },
  { status: "preparing", label: "Em Preparo", icon: "🔥", color: "text-yellow-400" },
  { status: "ready",     label: "Prontos",    icon: "✅", color: "text-green-400" },
];

export default function KDS() {
  const orders = useKDSStore((s) => s.orders);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            FF
          </div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
              🍳 Cozinha
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-sm">
            {columns.map((col) => {
              const count = orders.filter((o) => o.status === col.status).length;
              return (
                <span key={col.status} className={`${col.color} font-medium`}>
                  {col.icon} {count} {col.label}
                </span>
              );
            })}
          </div>
          <span className="font-mono text-neutral-400 text-sm tabular-nums">{clock}</span>
        </div>
      </header>

      {/* Columns */}
      <div className="flex flex-1 overflow-hidden gap-0 divide-x divide-neutral-800">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex-1 flex flex-col overflow-hidden">
              {/* Column header */}
              <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
                <h2 className={`text-sm font-bold ${col.color}`}>
                  {col.icon} {col.label}
                  <span className="ml-2 text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-normal">
                    {colOrders.length}
                  </span>
                </h2>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-700 text-center">
                    <span className="text-3xl mb-2">
                      {col.status === "new" ? "😴" : col.status === "preparing" ? "⏳" : "🎉"}
                    </span>
                    <p className="text-xs">
                      {col.status === "new"
                        ? "Nenhum pedido novo"
                        : col.status === "preparing"
                        ? "Nada em preparo"
                        : "Tudo entregue!"}
                    </p>
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <KDSOrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
