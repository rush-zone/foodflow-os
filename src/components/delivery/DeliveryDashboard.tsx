"use client";

import { useState } from "react";
import { useFlowStore, FlowStatus } from "@/store/useFlowStore";
import { useAuthStore } from "@/store/useAuthStore";
import DeliveryCard from "./DeliveryCard";
import DeliveryDetail from "./DeliveryDetail";
import DeliveryMapDynamic from "./DeliveryMapDynamic";
import MotoboyManagerModal from "./MotoboyManagerModal";

const summaryItems: { status: FlowStatus; label: string; icon: string; color: string }[] = [
  { status: "on_the_way", label: "A Caminho",  icon: "🏍️", color: "text-brand-primary" },
  { status: "preparing",  label: "Em Preparo", icon: "🍳",  color: "text-yellow-400" },
  { status: "ready",      label: "Prontos",    icon: "✅",  color: "text-purple-400" },
  { status: "delivered",  label: "Entregues",  icon: "📦",  color: "text-green-400" },
];

const statusOrder: FlowStatus[] = [
  "on_the_way", "ready", "picked_up", "preparing", "pending", "delivered", "cancelled",
];

export default function DeliveryDashboard() {
  const orders            = useFlowStore((s) => s.orders);
  const motoboys          = useFlowStore((s) => s.motoboys);
  const availableMotoboys = useFlowStore((s) => s.availableMotoboys);
  const role              = useAuthStore((s) => s.operator?.role);
  const canManage         = role === "admin" || role === "gerente";

  const [selectedId, setSelectedId] = useState<string | null>(
    orders.find((o) => o.type === "delivery" && o.status === "on_the_way")?.id ?? null
  );
  const [showManager, setShowManager] = useState(false);

  // Only delivery orders
  const deliveryOrders = orders
    .filter((o) => o.type === "delivery")
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  const active = deliveryOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const availableCount = motoboys.filter((m) => availableMotoboys.has(m.id)).length;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {showManager && <MotoboyManagerModal onClose={() => setShowManager(false)} />}

      <header className="flex items-center justify-between px-6 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-4">
          {summaryItems.map((s) => {
            const count = deliveryOrders.filter((o) => o.status === s.status).length;
            return (
              <div key={s.status} className="flex items-center gap-1.5 text-sm">
                <span>{s.icon}</span>
                <span className={`font-bold ${s.color}`}>{count}</span>
                <span className="text-neutral-500 text-xs">{s.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-bold text-green-400">{availableCount}</span>
            <span className="text-neutral-500 text-xs ml-1">motoboys livres</span>
          </div>
          <a
            href="/motoboy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            🏍️ Portal motoboy ↗
          </a>
          {canManage && (
            <button
              onClick={() => setShowManager(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Gerenciar
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — orders list */}
        <div className="w-72 border-r border-neutral-800 flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-2.5 border-b border-neutral-800 shrink-0">
            <p className="text-xs text-neutral-500">
              {active.length} {active.length === 1 ? "entrega ativa" : "entregas ativas"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {deliveryOrders.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                selected={selectedId === order.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>

        {/* Center — live map (isolate cria stacking context próprio, evita que o Leaflet vaze z-index sobre modais) */}
        <div className="flex-1 overflow-hidden p-3 isolate">
          <DeliveryMapDynamic />
        </div>

        {/* Right — order detail */}
        <div className="w-80 border-l border-neutral-800 shrink-0 overflow-hidden">
          <DeliveryDetail selectedId={selectedId} />
        </div>
      </div>
    </div>
  );
}
