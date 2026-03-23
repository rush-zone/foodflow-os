"use client";

import { useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useFlowStore } from "@/store/useFlowStore";
import OrderTypeModal from "./OrderTypeModal";

type GatewayState = "idle" | "awaiting_pix" | "awaiting_card" | "approved" | "confirming_cash";

export default function PaymentPanel() {
  const subtotal  = useOrderStore((s) => s.subtotal());
  const total     = useOrderStore((s) => s.total());
  const discount  = useOrderStore((s) => s.discount);
  const clearOrder = useOrderStore((s) => s.clearOrder);
  const items     = useOrderStore((s) => s.items);
  const createOrder = useFlowStore((s) => s.createOrder);

  const [showModal, setShowModal] = useState(false);
  const [pendingData, setPendingData] = useState<Parameters<typeof createOrder>[0] | null>(null);
  const [gateway, setGateway] = useState<GatewayState>("idle");
  const [confirmed, setConfirmed] = useState(false);

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
      setGateway("confirming_cash");
    } else if (data.paymentMethod === "pix") {
      setGateway("awaiting_pix");
      // Simulate PIX confirmation after 4s
      setTimeout(() => setGateway("approved"), 4000);
    } else {
      setGateway("awaiting_card");
    }
  }

  function finalizeOrder() {
    if (!pendingData) return;
    createOrder(pendingData);
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
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">💵</span>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-100">Pagamento em Dinheiro</p>
          <p className="text-lg font-black text-brand-primary mt-1">R$ {total.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs text-neutral-500 mt-1">Confirme o recebimento manualmente</p>
        </div>
        <button
          onClick={finalizeOrder}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors"
        >
          ✓ Recebi — Enviar para Cozinha
        </button>
        <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">
          Cancelar
        </button>
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

            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Desconto combo</span>
                <span>− R$ {discount.toFixed(2).replace(".", ",")}</span>
              </div>
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
