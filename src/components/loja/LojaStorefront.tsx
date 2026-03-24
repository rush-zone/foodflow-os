"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenuStore } from "@/store/useMenuStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useLojaCartStore } from "@/store/useLojaCartStore";
import { Category, Product } from "@/types";
import LojaCart from "./LojaCart";
import LojaCheckout from "./LojaCheckout";

type View = "menu" | "checkout";

/* ── Category card helpers ───────────────────────────────── */
const CATEGORY_FALLBACK: Record<string, string> = {
  burgers:  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
  pizza:    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300",
  drinks:   "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300",
  sides:    "https://images.unsplash.com/photo-1576777647209-e8733d7b851d?w=300",
  desserts: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300",
};

function getCoverImage(cat: Category, products: Product[]): string | null {
  if (cat.id === "all") return null;
  const fromProduct = products.find(
    (p) => p.category === cat.id && p.available && p.image
  );
  return fromProduct?.image ?? CATEGORY_FALLBACK[cat.id] ?? null;
}

/* ── Main component ──────────────────────────────────────── */
export default function LojaStorefront() {
  const router     = useRouter();
  const products   = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const config     = useConfigStore((s) => s.config);
  const add        = useLojaCartStore((s) => s.add);
  const count      = useLojaCartStore((s) => s.count);

  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen]             = useState(false);
  const [view, setView]                     = useState<View>("menu");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const available = products.filter((p) => p.available);
  const filtered  = activeCategory === "all"
    ? available
    : available.filter((p) => p.category === activeCategory);

  /* ── Confirmation screen ── */
  if (confirmedOrderId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <div>
          <p className="text-white font-black text-2xl">Pedido confirmado!</p>
          <p className="text-neutral-400 text-sm mt-2">
            Seu pedido foi recebido e já está sendo preparado.
          </p>
          <p className="text-brand-primary font-bold mt-3 text-lg">#{confirmedOrderId}</p>
        </div>
        <button
          onClick={() => { setConfirmedOrderId(null); setView("menu"); }}
          className="px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl transition-colors"
        >
          Fazer novo pedido
        </button>
      </div>
    );
  }

  /* ── Checkout screen ── */
  if (view === "checkout") {
    return (
      <LojaCheckout
        onBack={() => setView("menu")}
        onConfirmed={(id) => setConfirmedOrderId(id)}
      />
    );
  }

  /* ── Menu screen ── */
  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white leading-none">
              {config.restaurant.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Aberto agora
              </span>
              <span className="text-xs text-neutral-500">
                🏍️ ~{config.delivery.estimatedMinutes}min · R${" "}
                {config.delivery.fee.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary rounded-xl font-bold text-sm transition-colors"
          >
            🛒
            {count() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {count() > 9 ? "9+" : count()}
              </span>
            )}
            <span className="hidden sm:inline">Carrinho</span>
          </button>
        </div>

        {/* ── Category carousel ── */}
        <div className="max-w-3xl mx-auto px-4 pb-4 pt-1 flex gap-3 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const cover  = getCoverImage(cat, available);
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 relative w-20 h-20 rounded-2xl overflow-hidden transition-all ${
                  active
                    ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-neutral-950 scale-105"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {/* Background image or icon */}
                {cover ? (
                  <img
                    src={cover}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-3xl">
                    {cat.icon}
                  </div>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Active tint */}
                {active && (
                  <div className="absolute inset-0 bg-brand-primary/25" />
                )}

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 text-center">
                  <p className="text-white text-[10px] font-bold leading-tight drop-shadow">
                    {cat.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Product grid ── */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <p className="text-3xl mb-2">🍽️</p>
            <p>Nenhum produto disponível nesta categoria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/loja/produto/${product.id}`)}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col hover:border-neutral-700 transition-all cursor-pointer active:scale-[0.97]"
              >
                {/* Image */}
                <div className="relative h-36 overflow-hidden bg-neutral-800">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  {product.popular && (
                    <span className="absolute top-2 left-2 text-[9px] bg-brand-primary text-white px-1.5 py-0.5 rounded-full font-bold shadow">
                      ⭐ Popular
                    </span>
                  )}
                  {(product.extras ?? []).length > 0 && (
                    <span className="absolute top-2 right-2 text-[9px] bg-black/60 backdrop-blur text-neutral-300 px-1.5 py-0.5 rounded-full font-medium">
                      + Extras
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-xs font-bold text-white leading-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 leading-snug flex-1 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-black text-brand-primary">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        add({
                          productId: product.id,
                          name:      product.name,
                          price:     product.price,
                          image:     product.image,
                        });
                      }}
                      className="w-7 h-7 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-black text-lg flex items-center justify-center transition-colors active:scale-90 shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Floating cart bar ── */}
      {count() > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-20 max-w-3xl mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-xl flex items-center justify-between px-6 transition-colors"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-black">
              {count()}
            </span>
            <span>Ver carrinho</span>
            <span className="font-black">
              R$ {useLojaCartStore.getState().subtotal().toFixed(2).replace(".", ",")}
            </span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ── */}
      {cartOpen && (
        <LojaCart
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setView("checkout"); }}
        />
      )}
    </div>
  );
}
