"use client";

import { useState } from "react";
import { FlowOrder, useFlowStore } from "@/store/useFlowStore";
import KDSTimer from "./KDSTimer";
import WhatsAppToast from "./WhatsAppToast";

const typeLabel: Record<string, string> = {
  local: "🪑", delivery: "🏍️", takeaway: "🥡",
};

export default function KDSOrderCard({ order }: { order: FlowOrder }) {
  const startPreparing = useFlowStore((s) => s.startPreparing);
  const markReady      = useFlowStore((s) => s.markReady);
  const advanceDelivery = useFlowStore((s) => s.advanceDelivery);

  const [toast, setToast] = useState<{ customer: string; message: string } | null>(null);

  const borderColor =
    order.status === "pending"   ? "border-blue-500/40" :
    order.status === "preparing" ? "border-yellow-500/40" :
                                   "border-green-500/40";
  const headerBg =
    order.status === "pending"   ? "bg-blue-500/10" :
    order.status === "preparing" ? "bg-yellow-500/10" :
                                   "bg-green-500/10";
  const numberColor =
    order.status === "pending"   ? "text-blue-400" :
    order.status === "preparing" ? "text-yellow-400" :
                                   "text-green-400";

  const timerSince =
    order.status === "preparing"
      ? (order.timeline.find((e) => e.status === "preparing")?.timestamp ?? order.createdAt)
      : order.createdAt;

  function handleMotoboyPickup() {
    // Advance: ready → picked_up → on_the_way
    advanceDelivery(order.id); // ready → picked_up
    setTimeout(() => advanceDelivery(order.id), 100); // picked_up → on_the_way

    const msg = `Oi ${order.customer}! 🏍️ Seu pedido saiu para entrega agora. Em breve chegará até você! Qualquer dúvida, é só chamar.`;
    setToast({ customer: order.customer, message: msg });
  }

  function handleMarkReady() {
    markReady(order.id);
    if (order.type === "delivery" && order.phone) {
      const msg = `Oi ${order.customer}! ✅ Seu pedido está pronto e aguardando o motoboy. Entrega em breve!`;
      setToast({ customer: order.customer, message: msg });
    }
  }

  return (
    <>
      {toast && (
        <WhatsAppToast
          customer={toast.customer}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className={`bg-neutral-800 border ${borderColor} rounded-2xl overflow-hidden flex flex-col shadow-card animate-fade-in`}>
        {/* Header */}
        <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black ${numberColor}`}>#{order.number}</span>
            <span className="text-sm text-neutral-400 font-medium">
              {typeLabel[order.type]} {order.table ?? order.customer}
            </span>
          </div>
          <KDSTimer
            since={timerSince}
            urgent={order.status === "pending" ? 10 : 15}
            warning={order.status === "pending" ? 5 : 8}
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
                {item.notes && <p className="text-xs text-yellow-400 mt-0.5">⚠ {item.notes}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className="px-4 pb-2 text-xs text-neutral-600">
          Entrada: {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          {order.status === "pending" && (
            <button
              onClick={() => startPreparing(order.id)}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 font-bold text-sm rounded-xl transition-colors"
            >
              Iniciar Preparo
            </button>
          )}

          {order.status === "preparing" && (
            <button
              onClick={handleMarkReady}
              className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-neutral-900 font-bold text-sm rounded-xl transition-colors"
            >
              Marcar Pronto ✓
            </button>
          )}

          {order.status === "ready" && order.type === "delivery" && (
            <button
              onClick={handleMotoboyPickup}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl transition-colors"
            >
              🏍️ Motoboy Coletou
            </button>
          )}

          {order.status === "ready" && order.type !== "delivery" && (
            <div className="w-full py-2.5 text-center text-green-400 text-sm font-medium">
              {order.type === "takeaway" ? "⏳ Aguardando retirada" : "⏳ Aguardando cliente"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
