"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenuStore } from "@/store/useMenuStore";
import { useLojaCartStore, SelectedExtra } from "@/store/useLojaCartStore";
import { Product, ProductExtra } from "@/types";

interface Props {
  productId: string;
}

export default function LojaProductPage({ productId }: Props) {
  const router  = useRouter();
  const products = useMenuStore((s) => s.products);

  const product = products.find((p) => p.id === productId);
  const drinks  = products.filter((p) => p.category === "drinks" && p.available && p.id !== productId);

  const { items, add, updateQty, updateExtras } = useLojaCartStore();
  const cartItem = items.find((i) => i.productId === productId);

  const [selected, setSelected] = useState<Set<string>>(
    new Set((cartItem?.extras ?? []).map((e) => e.id))
  );
  const [qty, setQty]               = useState(cartItem?.quantity ?? 1);
  const [selectedDrink, setSelectedDrink] = useState<Product | null>(null);

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-neutral-500">
        <span className="text-5xl">🍽️</span>
        <p>Produto não encontrado</p>
        <button
          onClick={() => router.push("/loja")}
          className="text-brand-primary text-sm font-bold"
        >
          ← Voltar ao cardápio
        </button>
      </div>
    );
  }

  function toggleExtra(extra: ProductExtra) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(extra.id) ? next.delete(extra.id) : next.add(extra.id);
      return next;
    });
  }

  const selectedExtras: SelectedExtra[] = (product.extras ?? [])
    .filter((e) => selected.has(e.id))
    .map(({ id, name, price, stockLinks }) => ({ id, name, price, stockLinks }));

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const unitPrice   = product.price + extrasTotal;
  const totalPrice  = unitPrice * qty + (selectedDrink ? selectedDrink.price : 0);

  function handleAddToCart() {
    // Main product
    if (cartItem) {
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
      if (qty > 1) updateQty(product.id, qty);
    }

    // Drink upsell
    if (selectedDrink) {
      const drinkInCart = items.find((i) => i.productId === selectedDrink.id);
      if (drinkInCart) {
        updateQty(selectedDrink.id, drinkInCart.quantity + 1);
      } else {
        add({
          productId: selectedDrink.id,
          name:      selectedDrink.name,
          price:     selectedDrink.price,
          image:     selectedDrink.image,
        });
      }
    }

    router.push("/loja");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">

      {/* Hero image */}
      <div className="relative w-full h-72 sm:h-80 bg-neutral-900 shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl bg-neutral-800">
            🍽️
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur text-white text-sm font-medium hover:bg-black/70 transition-colors"
        >
          ← Voltar
        </button>

        {/* Popular badge */}
        {product.popular && (
          <span className="absolute top-4 right-4 text-[11px] bg-brand-primary text-white px-3 py-1 rounded-full font-bold shadow-lg">
            ⭐ Popular
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-5 pb-36">

          {/* Name + price */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-black text-white leading-tight flex-1">
              {product.name}
            </h1>
            <span className="text-xl font-black text-brand-primary shrink-0">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* ── Extras / Ingredientes ── */}
          {(product.extras ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Adicionais e ingredientes
              </h2>
              <div className="space-y-2">
                {product.extras!.map((extra) => {
                  const active = selected.has(extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left ${
                        active
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Circle checkbox */}
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            active
                              ? "border-brand-primary bg-brand-primary"
                              : "border-neutral-600"
                          }`}
                        >
                          {active && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-sm font-medium ${active ? "text-white" : "text-neutral-300"}`}>
                          {extra.name}
                        </span>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${active ? "text-brand-primary" : "text-neutral-500"}`}>
                        {extra.price === 0
                          ? "Grátis"
                          : `+R$ ${extra.price.toFixed(2).replace(".", ",")}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Drink upsell ── */}
          {drinks.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Adicione uma bebida
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                {drinks.map((drink) => {
                  const active = selectedDrink?.id === drink.id;
                  return (
                    <button
                      key={drink.id}
                      onClick={() =>
                        setSelectedDrink(active ? null : drink)
                      }
                      className={`shrink-0 w-28 rounded-2xl border overflow-hidden transition-all text-left ${
                        active
                          ? "border-brand-primary ring-2 ring-brand-primary/30"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {drink.image ? (
                        <div className="h-20 overflow-hidden bg-neutral-800">
                          <img
                            src={drink.image}
                            alt={drink.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-20 bg-neutral-800 flex items-center justify-center text-3xl">
                          🥤
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                          {drink.name}
                        </p>
                        <p className="text-[11px] text-brand-primary font-bold mt-0.5">
                          +R$ {drink.price.toFixed(2).replace(".", ",")}
                        </p>
                        {active && (
                          <span className="mt-1 inline-block text-[9px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full font-bold">
                            ✓ Selecionado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-neutral-950/95 backdrop-blur border-t border-neutral-800 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-neutral-800 rounded-2xl px-3 py-2.5 shrink-0">
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

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3.5 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl transition-colors flex items-center justify-between px-5 shadow-xl active:scale-[0.98]"
          >
            <span>{cartItem ? "Atualizar pedido" : "Adicionar ao carrinho"}</span>
            <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
