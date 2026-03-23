"use client";

import { useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { PaymentMethod } from "@/types";

const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "pix", label: "PIX", icon: "⚡" },
  { id: "card", label: "Cartão", icon: "💳" },
  { id: "cash", label: "Dinheiro", icon: "💵" },
];

export default function PaymentPanel() {
  const subtotal = useOrderStore((s) => s.subtotal());
  const total = useOrderStore((s) => s.total());
  const discount = useOrderStore((s) => s.discount);
  const paymentMethod = useOrderStore((s) => s.paymentMethod);
  const setPaymentMethod = useOrderStore((s) => s.setPaymentMethod);
  const setDiscount = useOrderStore((s) => s.setDiscount);
  const confirmOrder = useOrderStore((s) => s.confirmOrder);
  const clearOrder = useOrderStore((s) => s.clearOrder);
  const items = useOrderStore((s) => s.items);
  const status = useOrderStore((s) => s.status);

  const [discountInput, setDiscountInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function handleDiscount() {
    const val = parseFloat(discountInput.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      setDiscount(val);
    }
  }

  function handleConfirm() {
    if (!paymentMethod || items.length === 0) return;
    confirmOrder();
    setConfirmed(true);
    setTimeout(() => {
      clearOrder();
      setConfirmed(false);
      setDiscountInput("");
    }, 2000);
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <p className="text-green-400 font-bold text-sm">Pedido confirmado!</p>
        <p className="text-neutral-500 text-xs">Enviado para a cozinha</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <h2 className="text-sm font-bold text-neutral-100">Pagamento</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
        {/* Summary */}
        <div className="px-4 py-4 space-y-3 border-b border-neutral-800">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
          </div>

          {/* Discount */}
          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Desconto</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0,00"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-brand-primary/60 transition-colors"
              />
              <button
                onClick={handleDiscount}
                className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs text-neutral-300 transition-colors"
              >
                OK
              </button>
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-400 mt-1">
                − R$ {discount.toFixed(2).replace(".", ",")} aplicado
              </p>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
            <span className="text-sm font-bold text-neutral-100">Total</span>
            <span className="text-lg font-bold text-brand-primary">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-4 py-4 border-b border-neutral-800">
          <p className="text-xs text-neutral-500 mb-2">Forma de pagamento</p>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  paymentMethod === method.id
                    ? "bg-brand-primary/10 border border-brand-primary/50 text-brand-primary"
                    : "bg-neutral-800 border border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                <span>{method.icon}</span>
                <span>{method.label}</span>
                {paymentMethod === method.id && (
                  <span className="ml-auto text-brand-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 space-y-2 mt-auto">
          <button
            onClick={handleConfirm}
            disabled={items.length === 0 || !paymentMethod}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand-primary hover:bg-brand-secondary text-white shadow-lg"
          >
            Confirmar Pedido
          </button>
          <button
            onClick={clearOrder}
            disabled={items.length === 0}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-400/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
