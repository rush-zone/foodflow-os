"use client";

import { useState, useRef } from "react";
import { FlowOrder, useFlowStore } from "@/store/useFlowStore";
import KDSTimer from "@/components/kds/KDSTimer";

interface Props {
  order: FlowOrder;
  motoboyId: string;
  variant?: "active" | "available";
}

const paymentLabel: Record<string, string> = {
  cash:          "💵 Dinheiro",
  pix:           "⚡ PIX",
  card:          "💳 Cartão",
  card_delivery: "💳 Cobrar na entrega",
};

type CardGateway = "idle" | "awaiting" | "approved";

export default function MotoboyOrderCard({ order, motoboyId, variant = "active" }: Props) {
  const assignMotoboy   = useFlowStore((s) => s.assignMotoboy);
  const advanceDelivery = useFlowStore((s) => s.advanceDelivery);

  // PIN confirmation
  const [confirming, setConfirming] = useState(false);
  const [pin, setPin]               = useState(["", "", "", ""]);
  const [pinError, setPinError]     = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Card gateway (only for card_delivery orders)
  const [cardGateway, setCardGateway] = useState<CardGateway>("idle");

  const isCardDelivery = order.paymentMethod === "card_delivery";

  function handleCollect() {
    if (!order.motoboy || order.motoboy.id !== motoboyId) {
      assignMotoboy(order.id, motoboyId);
    }
    advanceDelivery(order.id);
    setTimeout(() => advanceDelivery(order.id), 80);
  }

  function openConfirm() {
    setPin(["", "", "", ""]);
    setPinError(false);
    setConfirming(true);
    setTimeout(() => inputRefs[0].current?.focus(), 80);
  }

  function handleDeliveryAction() {
    if (isCardDelivery && cardGateway === "idle") {
      setCardGateway("awaiting");
    } else {
      openConfirm();
    }
  }

  function handlePinChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[idx] = digit;
    setPin(next);
    setPinError(false);
    if (digit && idx < 3) inputRefs[idx + 1].current?.focus();
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  }

  function handleDeliver() {
    const liveOrder = useFlowStore.getState().orders.find((o) => o.id === order.id);
    const code   = liveOrder?.deliveryCode ?? order.deliveryCode;
    const entered = pin.join("");
    if (code && entered !== code) {
      setPinError(true);
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
      return;
    }
    advanceDelivery(order.id);
    setConfirming(false);
    setCardGateway("idle");
  }

  const isOnTheWay = order.status === "on_the_way" || order.status === "picked_up";
  const isReady    = order.status === "ready";

  const readySince    = order.timeline.find((e) => e.status === "ready")?.timestamp    ?? order.createdAt;
  const pickedUpSince = order.timeline.find((e) => e.status === "picked_up")?.timestamp ?? order.createdAt;

  const totalFmt = `R$ ${order.total.toFixed(2).replace(".", ",")}`;

  return (
    <>
      {/* ── Card terminal modal ── */}
      {cardGateway !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">

            {cardGateway === "awaiting" && (
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-4xl">💳</span>
                </div>
                <div>
                  <p className="text-base font-black text-white">Cobrar no cartão</p>
                  <p className="text-2xl font-black text-brand-primary mt-1">{totalFmt}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    #{order.number} — {order.customer}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Aproxime ou insira o cartão do cliente
                  </p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setCardGateway("idle")}
                    className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setCardGateway("approved")}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors active:scale-95"
                  >
                    ✓ Pagamento aprovado
                  </button>
                </div>
              </div>
            )}

            {cardGateway === "approved" && (
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
                <div>
                  <p className="text-base font-black text-green-400">Pagamento aprovado!</p>
                  <p className="text-sm font-black text-white mt-1">{totalFmt}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    Agora peça o código de confirmação ao cliente
                  </p>
                </div>
                <button
                  onClick={openConfirm}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors active:scale-95"
                >
                  🔑 Confirmar entrega →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PIN confirmation modal ── */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <span className="text-3xl">🔑</span>
              </div>
              <div>
                <p className="text-base font-black text-white">Código de confirmação</p>
                <p className="text-sm text-neutral-400 mt-1">
                  #{order.number} — {order.customer}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Peça os 4 dígitos ao cliente para confirmar a entrega
                </p>
              </div>

              <div className="flex gap-3">
                {pin.map((d, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className={`w-12 h-14 rounded-xl text-center text-2xl font-black bg-neutral-800 border-2 outline-none transition-colors ${
                      pinError
                        ? "border-red-500 text-red-400"
                        : d
                        ? "border-green-500 text-white"
                        : "border-neutral-700 text-white focus:border-brand-primary"
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-red-400 font-medium -mt-2">
                  Código incorreto. Tente novamente.
                </p>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeliver}
                  disabled={pin.some((d) => !d)}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors active:scale-95"
                >
                  ✓ Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order card ── */}
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
            <span className="text-sm font-bold text-white">{totalFmt}</span>
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
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <p className={`text-xs font-medium shrink-0 ${isCardDelivery ? "text-blue-400" : "text-neutral-600"}`}>
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
              onClick={handleDeliveryAction}
              className={`py-2 px-4 font-bold text-sm rounded-xl transition-colors active:scale-95 text-white ${
                isCardDelivery && cardGateway === "idle"
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {isCardDelivery && cardGateway === "idle" ? `💳 Cobrar ${totalFmt}` : "✓ Entregue"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
