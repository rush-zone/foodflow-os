"use client";

import { useDeliveryStore, DeliveryStatus } from "@/store/useDeliveryStore";
import DeliveryCard from "./DeliveryCard";
import DeliveryDetail from "./DeliveryDetail";

const statusOrder: DeliveryStatus[] = [
  "on_the_way", "ready", "preparing", "confirmed", "picked_up", "delivered", "failed",
];

const summaryConfig: { status: DeliveryStatus; label: string; icon: string; color: string }[] = [
  { status: "on_the_way", label: "A Caminho",  icon: "🏍️", color: "text-brand-primary" },
  { status: "preparing",  label: "Em Preparo", icon: "🍳", color: "text-yellow-400" },
  { status: "ready",      label: "Prontos",    icon: "✅", color: "text-purple-400" },
  { status: "delivered",  label: "Entregues",  icon: "📦", color: "text-green-400" },
];

export default function DeliveryDashboard() {
  const orders = useDeliveryStore((s) => s.orders);
  const motoboys = useDeliveryStore((s) => s.motoboys);

  const sorted = [...orders].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  const active = orders.filter((o) => !["delivered", "failed"].includes(o.status));
  const available = motoboys.filter((m) => m.available).length;

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            FF
          </div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full">
              🏍️ Delivery
            </span>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-4">
          {summaryConfig.map((s) => {
            const count = orders.filter((o) => o.status === s.status).length;
            return (
              <div key={s.status} className="flex items-center gap-1.5 text-sm">
                <span>{s.icon}</span>
                <span className={`font-bold ${s.color}`}>{count}</span>
                <span className="text-neutral-500 text-xs">{s.label}</span>
              </div>
            );
          })}
          <div className="h-4 w-px bg-neutral-700" />
          <div className="text-sm">
            <span className="font-bold text-green-400">{available}</span>
            <span className="text-neutral-500 text-xs ml-1">motoboys livres</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: order list */}
        <div className="w-80 border-r border-neutral-800 flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-2.5 border-b border-neutral-800 shrink-0">
            <p className="text-xs text-neutral-500">
              {active.length} {active.length === 1 ? "entrega ativa" : "entregas ativas"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sorted.map((order) => (
              <DeliveryCard key={order.id} order={order} />
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-hidden">
          <DeliveryDetail />
        </div>
      </div>
    </div>
  );
}
