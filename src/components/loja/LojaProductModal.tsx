"use client";

import { useEffect, useState } from "react";
import { Product, ProductExtra } from "@/types";
import { useLojaCartStore, SelectedExtra } from "@/store/useLojaCartStore";

interface Props {
  product: Product;
  onClose: () => void;
}

export default function LojaProductModal({ product, onClose }: Props) {
  const { items, add, updateQty, updateExtras } = useLojaCartStore();
  const cartItem = items.find((i) => i.productId === product.id);

  // initialise from existing cart item so re-opening preserves selections
  const [selected, setSelected] = useState<Set<string>>(
    new Set((cartItem?.extras ?? []).map((e) => e.id))
  );
  const [qty, setQty] = useState(cartItem?.quantity ?? 1);

  // close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function toggleExtra(extra: ProductExtra) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(extra.id) ? next.delete(extra.id) : next.add(extra.id);
      return next;
    });
  }

  const selectedExtras: SelectedExtra[] = (product.extras ?? [])
    .filter((e) => selected.has(e.id));

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const unitPrice   = product.price + extrasTotal;
  const totalPrice  = unitPrice * qty;

  function handleAdd() {
    if (cartItem) {
      // product already in cart — update extras then qty
      updateExtras(product.id, selectedExtras);
      updateQty(product.id, qty);
    } else {
      add({
        productId: product.id,
        name:      product.name,
        price:     product.price,
        image:     product.image,
        extras:    selectedExtras,
      });
      // add() sets qty=1; if user picked more, adjust
      if (qty > 1) updateQty(product.id, qty);
    }
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] flex flex-col bg-neutral-900 rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up-sheet">

        {/* Image */}
        {product.image ? (
          <div className="h-52 shrink-0 overflow-hidden relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center text-sm hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="h-40 shrink-0 bg-neutral-800 flex items-center justify-center text-5xl relative">
            🍽️
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center text-sm hover:bg-neutral-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          <div className="px-5 pt-4 pb-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-black text-white leading-tight">{product.name}</h2>
                {product.popular && (
                  <span className="inline-block mt-1 text-[10px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full font-bold">
                    Popular
                  </span>
                )}
              </div>
              <span className="text-lg font-black text-brand-primary shrink-0">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{product.description}</p>
          </div>

          {/* Extras */}
          {(product.extras ?? []).length > 0 && (
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Adicionais
              </h3>
              <div className="space-y-2">
                {product.extras!.map((extra) => {
                  const active = selected.has(extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left ${
                        active
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox visual */}
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          active
                            ? "border-brand-primary bg-brand-primary"
                            : "border-neutral-600"
                        }`}>
                          {active && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-sm font-medium ${active ? "text-white" : "text-neutral-300"}`}>
                          {extra.name}
                        </span>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${active ? "text-brand-primary" : "text-neutral-500"}`}>
                        {extra.price === 0 ? "Grátis" : `+R$ ${extra.price.toFixed(2).replace(".", ",")}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900 shrink-0">
          <div className="flex items-center gap-4">
            {/* Qty stepper */}
            <div className="flex items-center gap-3 bg-neutral-800 rounded-2xl px-3 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-black flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="text-sm font-bold text-white w-5 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-7 h-7 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-black flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              className="flex-1 py-3.5 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl transition-colors flex items-center justify-between px-5 shadow-lg"
            >
              <span>{cartItem ? "Atualizar" : "Adicionar"}</span>
              <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
