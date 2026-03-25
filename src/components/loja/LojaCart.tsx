"use client";

import { useLojaCartStore } from "@/store/useLojaCartStore";
import { useMenuStore } from "@/store/useMenuStore";

interface Props {
  onClose: () => void;
  onCheckout: () => void;
  onAddDrinks?: () => void;
}

export default function LojaCart({ onClose, onCheckout, onAddDrinks }: Props) {
  const { items, remove, updateQty, updateNotes, subtotal, clear } = useLojaCartStore();
  const products = useMenuStore((s) => s.products);
  const drinkIds = new Set(products.filter((p) => p.category === "drinks").map((p) => p.id));
  const hasDrinks = items.some((item) => drinkIds.has(item.productId));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-sm bg-white border-l border-neutral-200 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="font-black text-neutral-900 text-lg">🛒 Carrinho</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <span className="text-5xl">🛒</span>
            <p className="text-sm">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-neutral-200"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center text-2xl shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 leading-tight">{item.name}</p>
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
                      className="text-neutral-400 hover:text-red-500 transition-colors text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Qty control */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-neutral-900 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black flex items-center justify-center transition-colors"
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
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 placeholder-neutral-400 outline-none focus:border-brand-primary/60"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-neutral-200 space-y-3 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Subtotal</span>
                <span className="text-lg font-black text-neutral-900">
                  R$ {subtotal().toFixed(2).replace(".", ",")}
                </span>
              </div>
              {!hasDrinks && onAddDrinks && (
                <button
                  onClick={onAddDrinks}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  🥤 Adicionar bebidas
                </button>
              )}
              <button
                onClick={onCheckout}
                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black text-base rounded-2xl transition-colors shadow-lg"
              >
                Finalizar pedido →
              </button>
              <button
                onClick={clear}
                className="w-full py-2 text-xs text-neutral-400 hover:text-red-500 transition-colors"
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
