"use client";

import { KDSOrder } from "@/store/useKDSStore";
import { useKDSStore } from "@/store/useKDSStore";
import KDSTimer from "./KDSTimer";

interface KDSOrderCardProps {
  order: KDSOrder;
}

export default function KDSOrderCard({ order }: KDSOrderCardProps) {
  const startPreparing = useKDSStore((s) => s.startPreparing);
  const markReady = useKDSStore((s) => s.markReady);
  const dismiss = useKDSStore((s) => s.dismiss);

  const borderColor =
    order.status === "new"
      ? "border-blue-500/40"
      : order.status === "preparing"
      ? "border-yellow-500/40"
      : "border-green-500/40";

  const headerBg =
    order.status === "new"
      ? "bg-blue-500/10"
      : order.status === "preparing"
      ? "bg-yellow-500/10"
      : "bg-green-500/10";

  const numberColor =
    order.status === "new"
      ? "text-blue-400"
      : order.status === "preparing"
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className={`bg-neutral-800 border ${borderColor} rounded-2xl overflow-hidden flex flex-col shadow-card animate-fade-in`}>
      {/* Card header */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black ${numberColor}`}>#{order.number}</span>
          <span className="text-sm text-neutral-400 font-medium">{order.table}</span>
        </div>
        <KDSTimer
          since={order.status === "preparing" && order.startedAt ? order.startedAt : order.createdAt}
          urgent={order.status === "new" ? 10 : 15}
          warning={order.status === "new" ? 5 : 8}
        />
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-100 leading-tight">{item.name}</p>
              {item.notes && (
                <p className="text-xs text-yellow-400 mt-0.5">⚠ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timestamps */}
      <div className="px-4 pb-2 text-xs text-neutral-600">
        Entrada: {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        {order.startedAt && (
          <> · Início: {order.startedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        {order.status === "new" && (
          <button
            onClick={() => startPreparing(order.id)}
            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 font-bold text-sm rounded-xl transition-colors"
          >
            Iniciar Preparo
          </button>
        )}
        {order.status === "preparing" && (
          <button
            onClick={() => markReady(order.id)}
            className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-neutral-900 font-bold text-sm rounded-xl transition-colors"
          >
            Marcar Pronto ✓
          </button>
        )}
        {order.status === "ready" && (
          <button
            onClick={() => dismiss(order.id)}
            className="w-full py-2.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 font-bold text-sm rounded-xl transition-colors"
          >
            Retirado — Fechar
          </button>
        )}
      </div>
    </div>
  );
}
