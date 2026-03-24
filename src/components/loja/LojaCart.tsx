"use client";

import { useLojaCartStore } from "@/store/useLojaCartStore";

interface Props {
  onClose: () => void;
  onCheckout: () => void;
}

export default function LojaCart({ onClose, onCheckout }: Props) {
  const { items, remove, updateQty, updateNotes, subtotal, clear } = useLojaCartStore();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="font-black text-white text-lg">🛒 Carrinho</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-600">
            <span className="text-5xl">🛒</span>
            <p className="text-sm">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-neutral-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-neutral-700"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-neutral-700 flex items-center justify-center text-2xl shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                      {(item.extras ?? []).length > 0 && (
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          + {item.extras!.map((e) => e.name).join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-brand-primary font-bold mt-0.5">
                        R$ {((item.price + (item.extras ?? []).reduce((s, e) => s + e.price, 0)) * item.quantity).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item.productId)}
                      className="text-neutral-600 hover:text-red-400 transition-colors text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Qty control */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-black flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-black flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    placeholder="Observações (opcional)"
                    value={item.notes ?? ""}
                    onChange={(e) => updateNotes(item.productId, e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-neutral-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Subtotal</span>
                <span className="text-lg font-black text-white">
                  R$ {subtotal().toFixed(2).replace(".", ",")}
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black text-base rounded-2xl transition-colors shadow-lg"
              >
                Finalizar pedido →
              </button>
              <button
                onClick={clear}
                className="w-full py-2 text-xs text-neutral-600 hover:text-red-400 transition-colors"
              >
                Limpar carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
