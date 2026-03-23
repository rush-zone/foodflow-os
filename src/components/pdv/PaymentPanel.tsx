"use client";

import { useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useFlowStore } from "@/store/useFlowStore";
import OrderTypeModal from "./OrderTypeModal";

export default function PaymentPanel() {
  const subtotal = useOrderStore((s) => s.subtotal());
  const total = useOrderStore((s) => s.total());
  const discount = useOrderStore((s) => s.discount);
  const setDiscount = useOrderStore((s) => s.setDiscount);
  const clearOrder = useOrderStore((s) => s.clearOrder);
  const items = useOrderStore((s) => s.items);

  const createOrder = useFlowStore((s) => s.createOrder);

  const [discountInput, setDiscountInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleDiscount() {
    const val = parseFloat(discountInput.replace(",", "."));
    if (!isNaN(val) && val >= 0) setDiscount(val);
  }

  function handleModalConfirm(data: Parameters<typeof createOrder>[0] extends { items: unknown } ? never : Parameters<typeof createOrder>[0]) {
    createOrder({
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
    } as Parameters<typeof createOrder>[0]);

    setShowModal(false);
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
        <p className="text-green-400 font-bold text-sm">Pedido enviado!</p>
        <p className="text-neutral-500 text-xs">Aparecendo na cozinha agora</p>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <OrderTypeModal
          onConfirm={handleModalConfirm}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="flex flex-col h-full">
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

          {/* Actions */}
          <div className="px-4 py-4 space-y-2 mt-auto">
            <button
              onClick={() => setShowModal(true)}
              disabled={items.length === 0}
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
    </>
  );
}
