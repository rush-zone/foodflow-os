"use client";

import { useState, useEffect } from "react";
import { FlowOrder, useFlowStore } from "@/store/useFlowStore";
import { toast as notify } from "@/store/useToastStore";
import KDSTimer from "./KDSTimer";
import WhatsAppToast from "./WhatsAppToast";
import { PlatformBadge } from "@/components/shared/PlatformBadge";

function MotoboySelector({ order }: { order: FlowOrder }) {
  const motoboys          = useFlowStore((s) => s.motoboys);
  const availableMotoboys = useFlowStore((s) => s.availableMotoboys);
  const assignMotoboy     = useFlowStore((s) => s.assignMotoboy);
  const [open, setOpen]   = useState(false);

  const available = motoboys.filter((m) => availableMotoboys.has(m.id));

  if (order.motoboy) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-700/50 rounded-xl">
        <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {order.motoboy.avatar}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-200 truncate">{order.motoboy.name}</p>
          <p className="text-[10px] text-neutral-500">{order.motoboy.vehicle} · {order.motoboy.plate}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] text-neutral-500 hover:text-orange-400 transition-colors shrink-0"
        >
          trocar
        </button>
        {open && (
          <MotoboyDropdown
            available={available}
            onSelect={(id) => { assignMotoboy(order.id, id); setOpen(false); notify.success("Motoboy atribuído!", motoboys.find(m => m.id === id)?.name ?? ""); }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-700/40 hover:bg-neutral-700 border border-dashed border-neutral-600 hover:border-orange-500/50 rounded-xl transition-colors"
      >
        <span className="text-sm">🏍️</span>
        <span className="text-xs text-neutral-500 flex-1 text-left">Atribuir motoboy</span>
        <span className="text-[10px] text-neutral-600">{available.length > 0 ? `${available.length} disponível` : "todos ocupados"}</span>
      </button>
      {open && (
        <MotoboyDropdown
          available={available}
          onSelect={(id) => { assignMotoboy(order.id, id); setOpen(false); notify.success("Motoboy atribuído!", motoboys.find(m => m.id === id)?.name ?? ""); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function MotoboyDropdown({ available, onSelect, onClose }: {
  available: ReturnType<typeof useFlowStore.getState>["motoboys"];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
        {available.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-3 px-4">Nenhum motoboy disponível</p>
        ) : (
          available.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-700 transition-colors text-left"
            >
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {m.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-100 truncate">{m.name}</p>
                <p className="text-[10px] text-neutral-500">{m.vehicle} · {m.plate}</p>
              </div>
              <span className="text-[10px] text-green-400 shrink-0">● livre</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

const typeLabel: Record<string, string> = {
  local: "🪑", delivery: "🛵", takeaway: "🥡",
};

export default function KDSOrderCard({ order }: { order: FlowOrder }) {
  const startPreparing  = useFlowStore((s) => s.startPreparing);
  const markReady       = useFlowStore((s) => s.markReady);
  const advanceDelivery = useFlowStore((s) => s.advanceDelivery);
  const markDelivered   = useFlowStore((s) => s.markDelivered);

  const [toast, setToast] = useState<{ customer: string; message: string } | null>(null);
  const [minutesReady, setMinutesReady] = useState(0);

  // Conta quantos minutos o pedido está no status "ready"
  const readySince = order.timeline.find((e) => e.status === "ready")?.timestamp;
  useEffect(() => {
    if (order.status !== "ready" || !readySince) return;
    const update = () =>
      setMinutesReady(Math.floor((Date.now() - readySince.getTime()) / 60000));
    update();
    const interval = setInterval(update, 30000); // atualiza a cada 30s
    return () => clearInterval(interval);
  }, [order.status, readySince]);

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
    advanceDelivery(order.id); // ready → picked_up
    setTimeout(() => advanceDelivery(order.id), 100); // picked_up → on_the_way
    notify.info(`#${order.number} saiu para entrega`, order.customer);
    const msg = `Oi ${order.customer}! 🏍️ Seu pedido saiu para entrega agora. Em breve chegará até você! Qualquer dúvida, é só chamar.`;
    setToast({ customer: order.customer, message: msg });
  }

  function handleWhatsAppReminder() {
    const label = minutesReady >= 60
      ? `1 hora`
      : `${minutesReady} minutos`;
    const urgency = minutesReady >= 60
      ? `⏰ Seu pedido *#${order.number}* já está pronto há ${label}. Por favor, venha buscar o mais rápido possível!`
      : `😊 Seu pedido *#${order.number}* está pronto há ${label} e está te esperando para retirada!`;
    const msg = `Oi ${order.customer}! ${urgency}`;
    setToast({ customer: order.customer, message: msg });
  }

  function handleMarkReady() {
    markReady(order.id);
    notify.success(`#${order.number} pronto!`, order.customer);
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xl font-black ${numberColor}`}>#{order.number}</span>
            <span className="text-sm text-neutral-400 font-medium">
              {typeLabel[order.type]} {order.table ?? order.customer}
            </span>
            <PlatformBadge platform={order.platform} />
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

        {/* Motoboy assignment — só para delivery */}
        {order.type === "delivery" && (
          <div className="px-4 pb-3">
            <MotoboySelector order={order} />
          </div>
        )}

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
            <div className="space-y-2">
              <div className="w-full py-2 text-center text-green-400 text-xs font-medium">
                {order.type === "takeaway" ? "⏳ Aguardando retirada" : "⏳ Aguardando cliente"}
              </div>

              <button
                onClick={() => { markDelivered(order.id); notify.success(`#${order.number} entregue!`, order.customer); }}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl transition-colors active:scale-95"
              >
                ✓ Pedido Entregue
              </button>

              {/* Botão de lembrete WhatsApp após 30min */}
              {order.phone && minutesReady >= 30 && (
                <button
                  onClick={handleWhatsAppReminder}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    minutesReady >= 60
                      ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                      : "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25"
                  }`}
                >
                  <span>💬</span>
                  <span>
                    {minutesReady >= 60 ? "Lembrete urgente" : "Lembrar cliente"} · {minutesReady >= 60 ? "1h+" : `${minutesReady}min`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
