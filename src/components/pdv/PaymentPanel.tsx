"use client";

import { useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useFlowStore } from "@/store/useFlowStore";
import { useCaixaStore } from "@/store/useCaixaStore";
import { useEstoqueStore } from "@/store/useEstoqueStore";
import { useConfigStore } from "@/store/useConfigStore";
import { toast } from "@/store/useToastStore";
import OrderTypeModal from "./OrderTypeModal";

type GatewayState = "idle" | "awaiting_pix" | "awaiting_card" | "approved" | "confirming_cash";

function playPixSound() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, dur: number, vol = 0.4) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    play(523, 0,    0.12); // C5
    play(659, 0.14, 0.12); // E5
    play(784, 0.28, 0.18); // G5
    play(1047,0.46, 0.3);  // C6
  } catch { /* silent fail */ }
}

export default function PaymentPanel() {
  const subtotal  = useOrderStore((s) => s.subtotal());
  const total     = useOrderStore((s) => s.total());
  const discount  = useOrderStore((s) => s.discount);
  const clearOrder = useOrderStore((s) => s.clearOrder);
  const items     = useOrderStore((s) => s.items);
  const createOrder = useFlowStore((s) => s.createOrder);

  const setDiscount        = useOrderStore((s) => s.setDiscount);
  const allowManualDiscount = useConfigStore((s) => s.config.operation.allowManualDiscount);

  const [showModal, setShowModal] = useState(false);
  const [pendingData, setPendingData] = useState<Parameters<typeof createOrder>[0] | null>(null);
  const [gateway, setGateway] = useState<GatewayState>("idle");
  const [confirmed, setConfirmed] = useState(false);
  const [cashReceived, setCashReceived] = useState("");

  // Desconto manual
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountMode, setDiscountMode] = useState<"pct" | "value">("pct");
  const [discountInput, setDiscountInput] = useState("");

  function applyDiscount() {
    const raw = parseFloat(discountInput.replace(",", ".")) || 0;
    const value = discountMode === "pct"
      ? Math.min(subtotal * (raw / 100), subtotal)
      : Math.min(raw, subtotal);
    setDiscount(Math.max(0, value));
    setShowDiscount(false);
  }

  function removeDiscount() {
    setDiscount(0);
    setDiscountInput("");
    setShowDiscount(false);
  }

  function handleModalConfirm(data: Parameters<typeof createOrder>[0]) {
    const orderData = {
      ...data,
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        notes: i.notes,
      })),
      total,
      discount,
    } as Parameters<typeof createOrder>[0];

    setPendingData(orderData);
    setShowModal(false);

    if (data.paymentMethod === "cash") {
      setCashReceived("");
      setGateway("confirming_cash");
    } else if (data.paymentMethod === "card_delivery") {
      // Payment happens on delivery — send straight to kitchen
      setGateway("approved");
    } else if (data.paymentMethod === "pix") {
      setGateway("awaiting_pix");
      // Simulate PIX confirmation after 4s
      setTimeout(() => {
        setGateway("approved");
        playPixSound();
      }, 4000);
    } else {
      setGateway("awaiting_card");
    }
  }

  function finalizeOrder() {
    if (!pendingData) return;
    const orderId = createOrder(pendingData);

    // Deduzir estoque automaticamente
    useEstoqueStore.getState().deductForSale(
      items.map((i) => ({ stockLinks: i.product.stockLinks, quantity: i.quantity }))
    );

    // Auto-register cash payment in caixa if open
    if (pendingData.paymentMethod === "cash") {
      const caixa = useCaixaStore.getState();
      if (caixa.isOpen) {
        // find order number from store
        const order = useFlowStore.getState().orders.find((o) => o.id === orderId);
        const label = order ? `Venda #${order.number} — dinheiro` : "Venda em dinheiro — PDV";
        caixa.addMovement("suprimento", total, label, true);
      }
    }

    toast.success("Pedido enviado para a cozinha!", `R$ ${total.toFixed(2).replace(".", ",")} — ${pendingData.customer}`);
    setGateway("idle");
    setPendingData(null);
    setConfirmed(true);
    setTimeout(() => {
      clearOrder();
      setConfirmed(false);
    }, 2000);
  }

  function cancelPayment() {
    setGateway("idle");
    setPendingData(null);
    toast.info("Pagamento cancelado");
  }

  // --- Payment gateway screens ---
  if (gateway === "awaiting_pix") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-32 h-32 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-2xl flex items-center justify-center">
          <span className="text-5xl">⚡</span>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-100">Aguardando PIX</p>
          <p className="text-xs text-neutral-500 mt-1">R$ {total.toFixed(2).replace(".", ",")} — escaneie o QR code</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0,1,2].map((i) => (
            <span key={i} className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors mt-2">
          Cancelar
        </button>
      </div>
    );
  }

  if (gateway === "awaiting_card") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-20 h-20 bg-neutral-800 border-2 border-neutral-600 rounded-2xl flex items-center justify-center">
          <span className="text-4xl">💳</span>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-100">Aguardando Cartão</p>
          <p className="text-xs text-neutral-500 mt-1">R$ {total.toFixed(2).replace(".", ",")} — aproxime ou insira</p>
        </div>
        <button
          onClick={() => setGateway("approved")}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors"
        >
          ✓ Simular Aprovação
        </button>
        <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">
          Cancelar
        </button>
      </div>
    );
  }

  if (gateway === "approved") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <div>
          <p className="text-green-400 font-bold text-sm">Pagamento Aprovado!</p>
          <p className="text-xs text-neutral-500 mt-1">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>
        <button
          onClick={finalizeOrder}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors"
        >
          Enviar para Cozinha 🍳
        </button>
      </div>
    );
  }

  if (gateway === "confirming_cash") {
    const received = parseFloat(cashReceived.replace(",", ".")) || 0;
    const troco    = received - total;
    const PRESETS  = [total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100]
      .filter((v, i, a) => a.indexOf(v) === i && v >= total)
      .slice(0, 4);
    return (
      <div className="flex flex-col h-full px-4 py-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-sm font-bold text-neutral-100">Pagamento em Dinheiro</p>
            <p className="text-xs text-neutral-500">Total: R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        {/* Cash received input */}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Valor recebido</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder={total.toFixed(2)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          {/* Presets */}
          <div className="flex gap-2 mt-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setCashReceived(v.toFixed(2))}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-orange-500/20 hover:text-orange-400 text-neutral-400 transition-all border border-neutral-700"
              >
                {v.toFixed(0)}
              </button>
            ))}
          </div>
        </div>

        {/* Troco */}
        <div className={`rounded-xl p-4 text-center ${troco > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-neutral-800 border border-neutral-700"}`}>
          <p className="text-xs text-neutral-500 mb-1">Troco</p>
          <p className={`text-2xl font-black ${troco > 0 ? "text-green-400" : "text-neutral-600"}`}>
            R$ {troco > 0 ? troco.toFixed(2).replace(".", ",") : "0,00"}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={finalizeOrder}
            disabled={received < total && cashReceived !== ""}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-colors"
          >
            ✓ Confirmar e Enviar para Cozinha
          </button>
          <button onClick={cancelPayment} className="w-full py-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <p className="text-green-400 font-bold text-sm">Pedido na cozinha!</p>
        <p className="text-neutral-500 text-xs">Aparecendo no KDS agora</p>
      </div>
    );
  }

  // --- Idle state ---
  return (
    <>
      {showModal && (
        <OrderTypeModal onConfirm={handleModalConfirm} onClose={() => setShowModal(false)} />
      )}

      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-bold text-neutral-100">Resumo</h2>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
          <div className="px-4 py-4 space-y-3">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>

            {/* Linha de desconto */}
            {discount > 0 && !showDiscount && (
              <div className="flex justify-between items-center text-sm text-green-400">
                <button
                  onClick={() => { setShowDiscount(true); setDiscountInput(""); }}
                  className="flex items-center gap-1 hover:text-green-300 transition-colors"
                >
                  <span>Desconto</span>
                  <span className="text-xs text-green-600">✎</span>
                </button>
                <div className="flex items-center gap-2">
                  <span>− R$ {discount.toFixed(2).replace(".", ",")}</span>
                  <button onClick={removeDiscount} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>
            )}

            {/* Painel de edição de desconto */}
            {showDiscount && allowManualDiscount ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 space-y-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setDiscountMode("pct")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${discountMode === "pct" ? "bg-brand-primary text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                  >
                    % Percentual
                  </button>
                  <button
                    onClick={() => setDiscountMode("value")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${discountMode === "value" ? "bg-brand-primary text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                  >
                    R$ Valor
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    {discountMode === "pct" ? "%" : "R$"}
                  </span>
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    max={discountMode === "pct" ? 100 : subtotal}
                    step="0.01"
                    placeholder={discountMode === "pct" ? "10" : "5,00"}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyDiscount()}
                    className="w-full pl-8 pr-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-sm text-white font-bold text-right outline-none focus:border-brand-primary/60"
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowDiscount(false)} className="flex-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-700 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={applyDiscount} className="flex-1 py-1.5 text-xs font-bold bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Aplicar
                  </button>
                </div>
              </div>
            ) : (
              allowManualDiscount && discount === 0 && items.length > 0 && (
                <button
                  onClick={() => setShowDiscount(true)}
                  className="w-full py-1.5 text-xs text-neutral-600 hover:text-neutral-400 border border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg transition-all"
                >
                  + Adicionar desconto
                </button>
              )
            )}

            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              <span className="text-sm font-bold text-neutral-100">Total</span>
              <span className="text-xl font-black text-brand-primary">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="mt-auto px-4 py-4 space-y-2">
            <button
              onClick={() => setShowModal(true)}
              disabled={items.length === 0}
              className="w-full py-4 rounded-lg font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 active:scale-95 text-white shadow-lg shadow-green-900/30"
            >
              Confirmar Pedido
            </button>
            <button
              onClick={clearOrder}
              disabled={items.length === 0}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-400/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
