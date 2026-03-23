"use client";

import { useFlowStore, FlowStatus } from "@/store/useFlowStore";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import DeliveryTimeline from "./DeliveryTimeline";

const nextActionLabel: Partial<Record<FlowStatus, string>> = {
  ready:      "Confirmar Coleta →",
  picked_up:  "Saiu para Entrega →",
  on_the_way: "Confirmar Entrega →",
};

const paymentLabel: Record<string, string> = {
  pix: "PIX", card: "Cartão", cash: "Dinheiro",
};

export default function DeliveryDetail({ selectedId }: { selectedId: string | null }) {
  const orders = useFlowStore((s) => s.orders);
  const motoboys = useFlowStore((s) => s.motoboys);
  const availableMotoboys = useFlowStore((s) => s.availableMotoboys);
  const advanceDelivery = useFlowStore((s) => s.advanceDelivery);
  const assignMotoboy = useFlowStore((s) => s.assignMotoboy);

  const order = orders.find((o) => o.id === selectedId);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600">
        <span className="text-4xl mb-2">📦</span>
        <p className="text-sm">Selecione um pedido</p>
      </div>
    );
  }

  const canAdvance = ["ready", "picked_up", "on_the_way"].includes(order.status);
  const needsMotoboy = order.status === "ready" && !order.motoboy;
  const freeMotoboys = motoboys.filter((m) => availableMotoboys.has(m.id));

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div className="px-6 py-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-neutral-100">Pedido #{order.number}</h2>
          <DeliveryStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-neutral-500">
          {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {order.items.length} {order.items.length === 1 ? "item" : "itens"} · R${" "}
          {order.total.toFixed(2).replace(".", ",")} · {paymentLabel[order.paymentMethod] ?? order.paymentMethod}
        </p>
      </div>

      <div className="flex-1 px-6 py-4 space-y-6">
        {/* Customer */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Cliente</h3>
          <div className="bg-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary font-bold flex items-center justify-center text-sm">
                {order.customer[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-100">{order.customer}</p>
                {order.phone && <p className="text-xs text-neutral-500">{order.phone}</p>}
              </div>
            </div>
            {order.address && (
              <div className="pt-2 border-t border-neutral-700 text-sm text-neutral-300">
                📍 {order.address}
                {order.neighborhood && <span className="ml-2 text-xs text-neutral-500">{order.neighborhood}</span>}
              </div>
            )}
          </div>
        </section>

        {/* Items */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Itens</h3>
          <div className="bg-neutral-800 rounded-2xl divide-y divide-neutral-700 overflow-hidden">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-neutral-200">{item.name}</span>
                <span className="text-sm font-bold text-neutral-400">×{item.quantity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Motoboy */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Entregador</h3>
          {order.motoboy ? (
            <div className="bg-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold flex items-center justify-center text-sm">
                  {order.motoboy.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-100">{order.motoboy.name}</p>
                  <p className="text-xs text-neutral-500">
                    {order.motoboy.vehicle} · {order.motoboy.plate} · {order.motoboy.phone}
                  </p>
                </div>
                <a
                  href={`tel:${order.motoboy.phone}`}
                  className="ml-auto text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-xl hover:bg-green-500/20 transition-colors"
                >
                  📞 Ligar
                </a>
              </div>
            </div>
          ) : needsMotoboy ? (
            <div className="bg-neutral-800 rounded-2xl p-4">
              <p className="text-xs text-neutral-500 mb-3">Atribuir entregador disponível:</p>
              <div className="space-y-2">
                {freeMotoboys.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => assignMotoboy(order.id, m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs">
                      {m.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-100">{m.name}</p>
                      <p className="text-xs text-neutral-500">{m.vehicle}</p>
                    </div>
                    <span className="ml-auto text-xs text-green-400">● Livre</span>
                  </button>
                ))}
                {freeMotoboys.length === 0 && (
                  <p className="text-xs text-red-400 text-center py-2">Nenhum entregador disponível</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-800/50 rounded-2xl p-4 text-xs text-neutral-600 text-center">
              Entregador será atribuído quando o pedido estiver pronto
            </div>
          )}
        </section>

        {/* Timeline */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Rastreamento</h3>
          <DeliveryTimeline timeline={order.timeline} currentStatus={order.status} />
        </section>
      </div>

      {canAdvance && (
        <div className="px-6 py-4 border-t border-neutral-800 shrink-0">
          <button
            onClick={() => advanceDelivery(order.id)}
            className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl transition-colors shadow-lg"
          >
            {nextActionLabel[order.status] ?? "Avançar →"}
          </button>
        </div>
      )}

      {order.status === "delivered" && (
        <div className="px-6 py-4 border-t border-neutral-800 shrink-0">
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
            🎉 Pedido entregue com sucesso!
          </div>
        </div>
      )}
    </div>
  );
}
