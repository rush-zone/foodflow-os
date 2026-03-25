"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";
import { useFlowStore, FlowStatus } from "@/store/useFlowStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useKitchenStore, FLOW_META, fmtMinutes } from "@/store/useKitchenStore";
import DeliveryTimeline from "@/components/delivery/DeliveryTimeline";
import DeliveryStatusBadge from "@/components/delivery/DeliveryStatusBadge";
import GoogleMapCard, { GoogleMapCardRef } from "@/components/loja/GoogleMapCard";

interface Props {
  onBack:     () => void;
  onNewOrder: () => void;
}

const DELIVERY_RIDE_MIN = 20;

const STATUS_LABEL: Record<FlowStatus, { icon: string; msg: string; color: string }> = {
  pending:    { icon: "📋", msg: "Aguardando confirmação da lanchonete", color: "text-neutral-500" },
  preparing:  { icon: "🍳", msg: "Sendo preparado com carinho",          color: "text-amber-600"   },
  ready:      { icon: "✅", msg: "Pronto! Aguardando o entregador",       color: "text-green-600"   },
  picked_up:  { icon: "🏍️", msg: "Entregador coletou — saindo agora",    color: "text-brand-primary" },
  on_the_way: { icon: "🏍️", msg: "A caminho da sua casa!",                color: "text-brand-primary" },
  delivered:  { icon: "🎉", msg: "Entregue. Bom apetite!",               color: "text-green-600"   },
  cancelled:  { icon: "❌", msg: "Pedido cancelado",                      color: "text-neutral-400" },
};

const STEPS: { key: FlowStatus[]; label: string; icon: string }[] = [
  { key: ["pending"],                   label: "Recebido",   icon: "📋" },
  { key: ["preparing"],                 label: "Preparando", icon: "🍳" },
  { key: ["ready"],                     label: "Pronto",     icon: "✅" },
  { key: ["picked_up", "on_the_way"],   label: "A caminho",  icon: "🏍️" },
  { key: ["delivered"],                 label: "Entregue",   icon: "🎉" },
];

function getStepIndex(status: FlowStatus): number {
  if (status === "cancelled") return -1;
  return STEPS.findIndex((s) => s.key.includes(status));
}

/* ── WhatsApp icon ── */
function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.115 1.535 5.845L.057 23.882l6.204-1.625A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.887 9.887 0 01-5.031-1.371l-.361-.214-3.733.979 1.001-3.656-.235-.374A9.869 9.869 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106c5.421 0 9.894 4.474 9.894 9.894 0 5.421-4.473 9.894-9.894 9.894z"/>
    </svg>
  );
}

export default function LojaOrderTracking({ onBack, onNewOrder }: Props) {
  const session         = useLojaCustomerStore((s) => s.session);
  const activeOrderId   = session?.activeOrderId ?? null;
  const customerName    = session?.name ?? null;
  const logout          = useLojaCustomerStore((s) => s.logout);
  const orders          = useFlowStore((s) => s.orders);
  const estimatedMin    = useConfigStore((s) => s.config.delivery.estimatedMinutes);
  const restaurantPhone = useConfigStore((s) => s.config.restaurant.phone);
  const kitchenFlow     = useKitchenStore((s) => s.flow);
  const flowMeta        = FLOW_META[kitchenFlow];
  const flowMinutes     = useConfigStore((s) => s.config.delivery.flowMinutes);
  const fm              = flowMinutes?.[kitchenFlow] ?? (kitchenFlow === "normal" ? { min: 30, max: 60 } : { min: 60, max: 120 });
  const flowRange       = `${fmtMinutes(fm.min)} – ${fmtMinutes(fm.max)}`;

  const mapRef = useRef<GoogleMapCardRef>(null);

  const [tick, setTick]         = useState(0);
  const [mapEta, setMapEta]     = useState<string | null>(null);
  const [mapDist, setMapDist]   = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Sync cross-tab: quando a cozinha muda o status em outra aba, o evento
  // "storage" dispara aqui e recarrega o store do localStorage imediatamente.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "foodflow-orders") {
        useFlowStore.persist.rehydrate();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const order = orders.find((o) => o.id === activeOrderId);

  const { elapsedSec, remainSec, rideProgress } = useMemo(() => {
    if (!order) return { elapsedSec: 0, remainSec: 0, rideProgress: 0 };
    const ev    = order.timeline.find((e) => e.status === "on_the_way")
               ?? order.timeline.find((e) => e.status === "picked_up");
    const start = ev?.timestamp ?? new Date();
    const total = DELIVERY_RIDE_MIN * 60;
    const el    = Math.floor((Date.now() - start.getTime()) / 1000);
    return { elapsedSec: el, remainSec: Math.max(0, total - el), rideProgress: Math.min(0.99, el / total) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, tick]);

  useEffect(() => {
    mapRef.current?.updateMotoboy(rideProgress);
  }, [rideProgress]);

  /* ── empty state ── */
  if (!order) {
    return (
      <div className="min-h-screen bg-[#f3f1ed] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-6xl">📦</span>
        <p className="text-neutral-900 font-bold text-lg">Nenhum pedido ativo</p>
        <p className="text-neutral-500 text-sm">Seu pedido pode ter sido concluído ou ainda não foi feito.</p>
        <button
          onClick={onNewOrder}
          className="mt-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-2xl shadow-md shadow-brand-primary/30"
        >
          Fazer um pedido
        </button>
      </div>
    );
  }

  const label    = STATUS_LABEL[order.status];
  const isRiding = order.status === "on_the_way" || order.status === "picked_up";
  const isDone   = order.status === "delivered" || order.status === "cancelled";
  const showMap  = order.type === "delivery" && order.status !== "cancelled";
  const showCode = order.type === "delivery" && !isDone;
  const stepIdx  = getStepIndex(order.status);

  const remMin         = Math.ceil(remainSec / 60);
  const fmtMSS         = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const createdElapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
  const totalRemaining = Math.max(0, estimatedMin - createdElapsed);
  const createdEta     = new Date(order.createdAt.getTime() + estimatedMin * 60000);
  const isLate         = !isDone && Date.now() > createdEta.getTime() + 10 * 60_000;

  void totalRemaining;

  /* ════════════════════════════════════════════════════════════
     INFO PANEL — shared content, rendered both on mobile and
     in the desktop left column
  ════════════════════════════════════════════════════════════ */
  const InfoPanel = (
    <div className="space-y-3">

      {/* ── Status hero card ── */}
      <div className={`rounded-3xl border p-5 ${
        isDone && order.status === "delivered"
          ? "bg-green-50 border-green-200"
          : isDone
          ? "bg-neutral-100 border-neutral-200"
          : isRiding
          ? "bg-brand-primary/6 border-brand-primary/20"
          : "bg-white border-neutral-200 shadow-sm"
      }`}>
        <div className="flex items-start gap-4">
          <span className={`text-4xl shrink-0 ${order.status === "preparing" ? "animate-bounce" : ""}`}>
            {label.icon}
          </span>
          <div className="flex-1 min-w-0">
            <DeliveryStatusBadge status={order.status} />
            <p className={`text-sm font-semibold mt-1 leading-snug ${label.color}`}>
              {label.msg}
            </p>
            {!isDone && !isRiding && (
              <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full border ${flowMeta.bg} ${flowMeta.color}`}>
                {flowMeta.label} · {flowRange}
              </span>
            )}
          </div>
          {/* ETA counter */}
          {isRiding && (
            <div className="text-right shrink-0">
              {remainSec > 0 ? (
                <>
                  <p className="text-4xl font-black text-brand-primary leading-none tabular-nums">{remMin}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">min restantes</p>
                </>
              ) : (
                <p className="text-sm font-black text-green-500 animate-pulse">Chegando!</p>
              )}
            </div>
          )}
          {!isDone && !isRiding && order.type === "delivery" && (
            <div className="text-right shrink-0">
              <p className="text-base font-black text-neutral-900 leading-tight">{flowRange}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${flowMeta.color}`}>{flowMeta.label}</p>
            </div>
          )}
        </div>

        {/* Ride progress bar */}
        {isRiding && (
          <div className="mt-4 space-y-2">
            <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(99, rideProgress * 100)}%`,
                  background: "linear-gradient(90deg, #DC2626, #B91C1C)",
                  boxShadow: "0 0 8px rgba(220,38,38,0.35)",
                }}
              />
              {/* Motoboy dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-brand-primary rounded-full shadow-md transition-all duration-1000 ease-linear flex items-center justify-center text-[8px]"
                style={{ left: `${Math.min(99, rideProgress * 100)}%` }}
              >
                🏍️
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>🏪 Lanchonete</span>
              <span>em trânsito há {fmtMSS(elapsedSec)}</span>
              <span>📍 Você</span>
            </div>
            {(mapEta || mapDist) && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5">
                <span className="text-neutral-500">
                  {mapEta ? `🗺 ${mapEta}${mapDist ? ` · ${mapDist}` : ""}` : "Calculando rota..."}
                </span>
                <span className="text-neutral-500">
                  Chegada: <span className="text-neutral-900 font-bold">
                    {new Date(Date.now() + remainSec * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step progress ── */}
      {!isDone && order.status !== "cancelled" && (
        <div className="bg-white border border-neutral-200 rounded-3xl px-4 py-4 shadow-sm">
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              const isLast  = i === STEPS.length - 1;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                      current
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30 scale-110"
                        : done
                        ? "bg-brand-primary/15 text-brand-primary"
                        : "bg-neutral-100 text-neutral-300"
                    }`}>
                      {done ? "✓" : step.icon}
                    </div>
                    <span className={`text-[9px] font-bold text-center leading-tight max-w-[46px] ${
                      current ? "text-brand-primary" : done ? "text-neutral-500" : "text-neutral-300"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors duration-500 ${
                      i < stepIdx ? "bg-brand-primary/40" : "bg-neutral-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Endereço ── */}
      {order.type === "delivery" && order.address && !isDone && (
        <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-brand-primary" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Endereço de entrega</p>
            <p className="text-sm font-bold text-neutral-900 leading-tight">{order.address}</p>
            {order.neighborhood && (
              <p className="text-xs text-neutral-500 mt-0.5">{order.neighborhood}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Motoboy + código de confirmação ── */}
      {(isRiding || showCode) && (
        <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
          {order.motoboy && isRiding && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-lg shrink-0">
                🏍️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 leading-none">{order.motoboy.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{order.motoboy.vehicle} · {order.motoboy.plate}</p>
              </div>
              <a
                href={`tel:${order.motoboy.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors"
              >
                📞 Ligar
              </a>
            </div>
          )}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
              Código de confirmação
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {(order.deliveryCode ?? "----").split("").map((d, i) => (
                  <div
                    key={i}
                    className="w-11 h-14 rounded-2xl bg-[#f3f1ed] border border-brand-primary/30 flex items-center justify-center text-2xl font-black text-brand-primary shadow-sm"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug ml-2">
                Mostre ao<br/>entregador
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp ── */}
      {!isDone && (
        isLate ? (
          <a
            href={`https://wa.me/55${restaurantPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Meu pedido #${order.number} está atrasado. Pode verificar o status?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-2xl bg-green-50 border border-green-200 text-green-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
          >
            <WaIcon className="w-4 h-4" />
            Pedido atrasado? Falar com a lanchonete
          </a>
        ) : (
          <div className="w-full py-3 rounded-2xl border border-neutral-200 text-neutral-400 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none bg-white">
            <WaIcon className="w-4 h-4 opacity-30" />
            Mensagem disponível se houver atraso
          </div>
        )
      )}

      {/* ── Resumo do pedido ── */}
      <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pedido #{order.number}</span>
          <span className="text-base font-black text-brand-primary">R$ {order.total.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="space-y-1.5 pt-2 border-t border-neutral-100">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <p className="text-xs text-neutral-600 truncate flex-1">{item.name}</p>
              <p className="text-xs font-semibold text-neutral-500 shrink-0">
                R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline (collapsible) ── */}
      <div className="bg-white border border-neutral-200 shadow-sm rounded-3xl overflow-hidden">
        <button
          onClick={() => setTimelineOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Histórico do pedido
          </span>
          <span className="text-neutral-400 text-xs transition-transform duration-200" style={{ display: "inline-block", transform: timelineOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </button>
        {timelineOpen && (
          <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
            <DeliveryTimeline timeline={order.timeline} currentStatus={order.status} />
          </div>
        )}
      </div>

      {/* ── Done action ── */}
      {isDone && (
        <button
          onClick={onNewOrder}
          className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl transition-colors shadow-lg shadow-brand-primary/20"
        >
          {order.status === "delivered" ? "🍔 Fazer novo pedido" : "Voltar ao cardápio"}
        </button>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════
     MAP BLOCK
  ══════════════════════════════════════════════════ */
  const MapBlock = (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-neutral-200">
      {showMap && !mapError ? (
        <GoogleMapCard
          ref={mapRef}
          customerAddress={order.address ?? ""}
          customerNeighborhood={order.neighborhood}
          isRiding={isRiding}
          onReady={(eta, dist) => { setMapEta(eta); setMapDist(dist); }}
          onError={() => setMapError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400">
          <span className="text-4xl">🗺</span>
          <p className="text-sm font-medium">
            {order.type === "pickup" ? "Retirada no local" : "Mapa indisponível"}
          </p>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col bg-[#f3f1ed] overflow-hidden">

      {/* ── Top header bar ── */}
      <header className="shrink-0 bg-white border-b border-neutral-100 shadow-sm z-30">
        <div className="h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary" />
        <div className="h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-semibold text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Cardápio
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-neutral-900">Pedido #{order.number}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          </div>

          {customerName ? (
            <button
              onClick={() => { logout(); onBack(); }}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors font-semibold"
            >
              Sair
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 overflow-hidden">

        {/* ══ DESKTOP: two columns ══ */}
        <div className="hidden md:flex h-full max-w-7xl mx-auto w-full gap-5 p-5">
          {/* Left: info panel */}
          <div className="w-[420px] xl:w-[460px] shrink-0 overflow-y-auto scrollbar-loja pr-1">
            {InfoPanel}
          </div>
          {/* Right: map */}
          <div className="relative flex-1 rounded-3xl overflow-hidden shadow-sm">
            {MapBlock}
          </div>
        </div>

        {/* ══ MOBILE: vertical scroll stack ══ */}
        <div className="md:hidden h-full overflow-y-auto scrollbar-loja">
          <div className="px-4 pt-4 pb-8 space-y-3">

            {/* Map — compact, secondary */}
            {showMap && (
              <div className="relative h-48 rounded-3xl overflow-hidden shadow-sm">
                {MapBlock}
              </div>
            )}

            {InfoPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
