"use client";

import { useState } from "react";
import { FlowOrder, useFlowStore } from "@/store/useFlowStore";
import KDSTimer from "@/components/kds/KDSTimer";

interface Props {
  order: FlowOrder;
  motoboyId: string;
  variant?: "active" | "available";
}

const paymentLabel: Record<string, string> = {
  cash: "💵 Dinheiro",
  pix: "⚡ PIX",
  card: "💳 Cartão",
};

export default function MotoboyOrderCard({ order, motoboyId, variant = "active" }: Props) {
  const assignMotoboy   = useFlowStore((s) => s.assignMotoboy);
  const advanceDelivery = useFlowStore((s) => s.advanceDelivery);
  const [confirming, setConfirming] = useState(false);

  function handleCollect() {
    if (!order.motoboy || order.motoboy.id !== motoboyId) {
      assignMotoboy(order.id, motoboyId);
    }
    // ready → picked_up → on_the_way
    advanceDelivery(order.id);
    setTimeout(() => advanceDelivery(order.id), 80);
  }

  function handleDeliver() {
    advanceDelivery(order.id); // on_the_way → delivered
    setConfirming(false);
  }

  const isOnTheWay = order.status === "on_the_way" || order.status === "picked_up";
  const isReady    = order.status === "ready";

  // Momento em que ficou ready (ou createdAt como fallback)
  const readySince =
    order.timeline.find((e) => e.status === "ready")?.timestamp ?? order.createdAt;
  // Momento em que foi coletado (para contar tempo em trânsito)
  const pickedUpSince =
    order.timeline.find((e) => e.status === "picked_up")?.timestamp ?? order.createdAt;

  return (
    <>
      {/* Modal de confirmação de entrega */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>

              <div>
                <p className="text-base font-black text-white">Confirmar entrega de pedido!</p>
                <p className="text-sm text-neutral-400 mt-1">
                  #{order.number} — {order.customer}
                </p>
                {order.address && (
                  <p className="text-xs text-neutral-500 mt-0.5">📍 {order.address}</p>
                )}
              </div>

              <p className="text-xs text-neutral-500">
                O pedido foi entregue com sucesso ao cliente?
              </p>

              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeliver}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors active:scale-95"
                >
                  ✓ Sim, entregue!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    <div className={`bg-neutral-900 border rounded-2xl overflow-hidden ${
      isOnTheWay ? "border-orange-500/40" : "border-neutral-800"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isOnTheWay ? "bg-orange-500/10" : "bg-neutral-800/50"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black ${isOnTheWay ? "text-orange-400" : "text-blue-400"}`}>
            #{order.number}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isOnTheWay
              ? "bg-orange-500/20 text-orange-300"
              : "bg-blue-500/20 text-blue-300"
          }`}>
            {isOnTheWay ? "A caminho" : "Pronto para coleta"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <KDSTimer
            since={isOnTheWay ? pickedUpSince : readySince}
            warning={isOnTheWay ? 15 : 5}
            urgent={isOnTheWay ? 30 : 10}
          />
          <span className="text-sm font-bold text-white">
            R$ {order.total.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Cliente + Endereço */}
      <div className="px-4 py-3 border-b border-neutral-800 space-y-1">
        <p className="text-sm font-bold text-white">{order.customer}</p>
        {order.address && (
          <p className="text-xs text-neutral-400">📍 {order.address}</p>
        )}
        {order.neighborhood && (
          <p className="text-xs text-neutral-500">{order.neighborhood}</p>
        )}
        {order.phone && (
          <a
            href={`tel:${order.phone}`}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 mt-0.5"
          >
            📞 {order.phone}
          </a>
        )}
      </div>

      {/* Itens */}
      <div className="px-4 py-3 space-y-1.5 border-b border-neutral-800">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center justify-center shrink-0">
              {item.quantity}
            </span>
            <p className="text-xs text-neutral-300">{item.name}</p>
          </div>
        ))}
      </div>

      {/* Pagamento + Ação */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-neutral-600">
          {paymentLabel[order.paymentMethod] ?? order.paymentMethod}
        </p>
        {isReady && (
          <button
            onClick={handleCollect}
            className="py-2 px-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm rounded-xl transition-colors active:scale-95"
          >
            🏍️ Coletar
          </button>
        )}
        {isOnTheWay && (
          <button
            onClick={() => setConfirming(true)}
            className="py-2 px-4 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl transition-colors active:scale-95"
          >
            ✓ Entregue
          </button>
        )}
      </div>
    </div>
    </>
  );
}
