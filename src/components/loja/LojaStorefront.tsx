"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMenuStore } from "@/store/useMenuStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useLojaCartStore } from "@/store/useLojaCartStore";
import { Category, Product } from "@/types";
import LojaCart from "./LojaCart";
import LojaCheckout from "./LojaCheckout";
import LojaOrderTracking from "./LojaOrderTracking";
import LojaCustomerLogin from "./LojaCustomerLogin";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";

type View = "menu" | "checkout" | "tracking" | "login";

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

/* ── Product Card ──────────────────────────────────────── */
function ProductCard({
  product,
  onView,
  onAdd,
}: {
  product: Product;
  onView: () => void;
  onAdd: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onView}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-neutral-100" style={{ aspectRatio: "4/3" }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.popular && (
            <span className="bg-brand-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
              ⭐ Popular
            </span>
          )}
        </div>
        {(product.extras ?? []).length > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
            + Opções
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-bold text-neutral-900 text-sm leading-tight line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-neutral-400 mt-1 leading-snug line-clamp-2 flex-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-black text-brand-primary leading-none">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <button
            onClick={onAdd}
            className="w-9 h-9 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-black text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 border-2 border-white shadow-lg"
            style={{ boxShadow: "0 4px 12px rgba(220,38,38,0.4)" }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function LojaStorefront() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const products   = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const config     = useConfigStore((s) => s.config);
  const count      = useLojaCartStore((s) => s.count);

  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen]             = useState(false);
  const [view, setView]                     = useState<View>("menu");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const session        = useLojaCustomerStore((s) => s.session);
  const logoutCustomer = useLojaCustomerStore((s) => s.logout);
  const activeOrderId  = session?.activeOrderId ?? null;
  const customerName   = session?.name ?? null;
  const firstName      = customerName?.split(" ")[0] ?? null;

  const available = products.filter((p) => p.available);
  const filtered  = useMemo(
    () => activeCategory === "all" ? available : available.filter((p) => p.category === activeCategory),
    [available, activeCategory]
  );

  const currentCat = categories.find((c) => c.id === activeCategory);

  useEffect(() => {
    if (searchParams.get("checkout") === "1") {
      setView("checkout");
      router.replace("/loja");
    }
  }, [searchParams, router]);

  function handleAddQuick(product: Product, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/loja/produto/${product.id}`);
  }

  /* ── Confirmation screen ── */
  if (confirmedOrderId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center gap-5 overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-4xl shadow-lg">
          ✅
        </div>
        <div>
          <p className="text-neutral-900 font-black text-2xl">Pedido confirmado!</p>
          <p className="text-neutral-500 text-sm mt-2">Recebemos seu pedido e já estamos preparando.</p>
          <p className="text-brand-primary font-black mt-3 text-2xl tracking-wide">#{confirmedOrderId}</p>
        </div>
        <button
          onClick={() => { setConfirmedOrderId(null); setView("tracking"); }}
          className="w-full max-w-xs py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black text-base rounded-2xl transition-colors shadow-lg shadow-brand-primary/30"
        >
          📦 Acompanhar pedido
        </button>
        <button
          onClick={() => { setConfirmedOrderId(null); setView("menu"); }}
          className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          Voltar ao cardápio
        </button>
      </div>
    );
  }

  if (view === "tracking") {
    return <LojaOrderTracking onBack={() => setView("menu")} onNewOrder={() => { setConfirmedOrderId(null); setView("menu"); }} />;
  }

  if (view === "login") {
    return <LojaCustomerLogin onBack={() => setView("menu")} onFound={() => setView("tracking")} />;
  }

  if (view === "checkout") {
    return <LojaCheckout onBack={() => setView("menu")} onConfirmed={(id) => setConfirmedOrderId(id)} />;
  }

  /* ── Menu screen ── */
  return (
    <div className="h-screen flex flex-col bg-[#f3f1ed] overflow-hidden">

      {/* ══════════════════════ HEADER ══════════════════════ */}
      <header className="shrink-0 bg-white border-b border-neutral-100 shadow-sm z-30">
        {/* Red brand accent bar */}
        <div className="h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main header row */}
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Logo + Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-brand-primary/30">
                FF
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="font-black text-neutral-900 text-sm leading-none truncate">
                  {config.restaurant.name}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">Vila Santa Cecília · Volta Redonda</p>
              </div>
            </div>

            {/* Delivery badges — desktop only */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
              <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                Aberto agora
              </span>
              <span className="text-neutral-300 text-xs">·</span>
              <span className="bg-neutral-100 text-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                🏍️ ~{config.delivery.estimatedMinutes} min
              </span>
              <span className="text-neutral-300 text-xs">·</span>
              <span className="bg-neutral-100 text-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                Entrega R$ {config.delivery.fee.toFixed(2).replace(".", ",")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active order */}
              {activeOrderId && (
                <button
                  onClick={() => setView("tracking")}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/25 text-brand-primary text-xs font-bold rounded-xl hover:bg-brand-primary/15 transition-colors"
                >
                  📦 Meu pedido
                </button>
              )}

              {/* Account pill */}
              {firstName ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={logoutCustomer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[9px] font-black flex items-center justify-center shrink-0">
                      {firstName[0].toUpperCase()}
                    </span>
                    {firstName}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setView("login")}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Entrar
                </button>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/40"
              >
                {/* Shopping cart icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                  <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
                  <path d="M1 1h4l2.68 13.39A2 2 0 009.66 16h9.72a2 2 0 001.97-1.69L23 6H6"/>
                </svg>
                {count() > 0 ? (
                  <>
                    <span className="hidden sm:inline font-black text-sm">
                      {count()} {count() === 1 ? "item" : "itens"}
                    </span>
                    <span className="sm:hidden font-black">{count()}</span>
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neutral-900 text-white text-[9px] font-black rounded-full flex items-center justify-center sm:hidden">
                      {count() > 9 ? "9+" : count()}
                    </span>
                  </>
                ) : (
                  <span className="hidden sm:inline">Carrinho</span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile: delivery info strip */}
          <div className="md:hidden flex items-center gap-3 pb-2 -mt-1 text-xs">
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Aberto
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">🏍️ ~{config.delivery.estimatedMinutes}min</span>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">Taxa R$ {config.delivery.fee.toFixed(2).replace(".", ",")}</span>
            {!firstName && (
              <>
                <span className="text-neutral-300">·</span>
                <button onClick={() => setView("login")} className="text-brand-primary font-semibold">
                  Entrar
                </button>
              </>
            )}
          </div>

          {/* Mobile: Category tiles */}
          <div className="md:hidden -mx-4 px-4 pb-3 flex gap-2.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              const catCount = cat.id === "all" ? available.length : available.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1 w-[68px] h-[68px] rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${
                    active
                      ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/40 scale-105"
                      : "bg-white border-neutral-100 text-neutral-600 shadow-sm active:scale-95"
                  }`}
                >
                  <span className="text-[26px] leading-none">{cat.icon}</span>
                  <span className={`text-[9px] font-black leading-none text-center px-1 ${active ? "text-white" : "text-neutral-600"}`}>
                    {cat.name.split(" ")[0]}
                  </span>
                  {catCount > 0 && (
                    <span className={`absolute top-1 right-1 text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center ${
                      active ? "bg-white/30 text-white" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {catCount > 9 ? "9+" : catCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ══════════════════════ BODY ══════════════════════ */}
      <div className="flex-1 overflow-hidden flex max-w-7xl w-full mx-auto bg-[#f3f1ed]">

        {/* ── SIDEBAR — desktop only ── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-neutral-100 overflow-y-auto scrollbar-loja">
          <div className="p-5 space-y-1">

            {/* Restaurant card */}
            <div className="rounded-2xl overflow-hidden mb-5 border border-neutral-200 bg-white shadow-sm">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm shadow-brand-primary/30">
                    FF
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-neutral-900 text-sm leading-tight truncate">{config.restaurant.name}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                      Vila Santa Cecília · Volta Redonda, RJ
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-2.5 py-1 text-[10px] font-bold">
                    🟢 Aberto
                  </span>
                  <span className="bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-lg px-2.5 py-1 text-[10px] font-bold">
                    🏍️ ~{config.delivery.estimatedMinutes}min
                  </span>
                  <span className="bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-lg px-2.5 py-1 text-[10px] font-bold">
                    R$ {config.delivery.fee.toFixed(2).replace(".", ",")} frete
                  </span>
                </div>
              </div>
            </div>

            {/* Account section */}
            {session && (
              <div className="mb-4 px-1">
                <div className="flex items-center gap-2 py-2">
                  <div className="w-7 h-7 rounded-full bg-brand-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    {session.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">{session.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{session.email}</p>
                  </div>
                  <button onClick={logoutCustomer} className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors shrink-0">
                    Sair
                  </button>
                </div>
                {activeOrderId && (
                  <button
                    onClick={() => setView("tracking")}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 bg-brand-primary/8 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary hover:bg-brand-primary/12 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                    Acompanhar meu pedido →
                  </button>
                )}
              </div>
            )}

            {/* Category nav */}
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-2 pt-1">
              Cardápio
            </p>
            <nav className="space-y-0.5">
              {categories.map((cat) => {
                const active = activeCategory === cat.id;
                const catCount = cat.id === "all" ? available.length : available.filter((p) => p.category === cat.id).length;
                const cover = getCoverImage(cat, available);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group ${
                      active
                        ? "bg-brand-primary text-white font-bold shadow-md shadow-brand-primary/20"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    }`}
                  >
                    {cover && cat.id !== "all" ? (
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                        <img src={cover} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-base w-7 text-center shrink-0">{cat.icon}</span>
                    )}
                    <span className="flex-1 leading-none">{cat.name}</span>
                    <span className={`text-xs shrink-0 ${active ? "text-red-200" : "text-neutral-400"}`}>
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── PRODUCT CONTENT ── */}
        <main className="flex-1 overflow-y-auto scrollbar-loja">
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-24 max-w-5xl">

            {/* Section header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-brand-primary rounded-full shrink-0" />
                <div>
                  <h2 className="text-xl font-black text-neutral-900 leading-none">
                    {activeCategory === "all"
                      ? "Todo o cardápio"
                      : currentCat?.name ?? "Produtos"}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {filtered.length} {filtered.length === 1 ? "produto disponível" : "produtos disponíveis"}
                  </p>
                </div>
              </div>
              {config.delivery.freeAbove > 0 && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
                  🎉 Frete grátis acima de R$ {config.delivery.freeAbove.toFixed(0)}
                </span>
              )}
            </div>

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <span className="text-5xl">🍽️</span>
                <p className="text-neutral-500 font-semibold">Nada disponível nesta categoria</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={() => router.push(`/loja/produto/${product.id}`)}
                    onAdd={(e) => handleAddQuick(product, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Floating cart bar — mobile only when sidebar hidden ── */}
      {count() > 0 && !cartOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-[#f3f1ed] via-[#f3f1ed]/90 to-transparent pt-6">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/30 flex items-center justify-between px-6 transition-all"
          >
            <span className="bg-white/20 rounded-lg px-2.5 py-0.5 text-sm font-black">{count()}</span>
            <span>Ver carrinho</span>
            <span className="font-black text-sm">
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
          onAddDrinks={() => { setCartOpen(false); setActiveCategory("drinks"); }}
        />
      )}
    </div>
  );
}
