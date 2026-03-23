"use client";

import { useState } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import { Product } from "@/types";

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

// ─── Product form modal ───────────────────────────────────────────────────────
function ProductModal({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const { categories, addProduct, updateProduct } = useMenuStore();
  const cats = categories.filter((c) => c.id !== "all");

  const [name, setName]         = useState(product?.name ?? "");
  const [desc, setDesc]         = useState(product?.description ?? "");
  const [price, setPrice]       = useState(product ? fmt(product.price) : "");
  const [image, setImage]       = useState(product?.image ?? "");
  const [category, setCategory] = useState(product?.category ?? cats[0]?.id ?? "");
  const [available, setAvailable] = useState(product?.available ?? true);
  const [popular, setPopular]   = useState(product?.popular ?? false);

  function handleSave() {
    const priceVal = parseFloat(price.replace(",", "."));
    if (!name.trim() || !priceVal) return;
    const data = { name: name.trim(), description: desc.trim(), price: priceVal, image: image.trim(), category, available, popular };
    if (product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-[460px] shadow-card overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h3 className="font-bold text-white">{product ? "Editar Produto" : "Novo Produto"}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Preview */}
          {image && (
            <div className="w-full h-32 rounded-xl overflow-hidden bg-neutral-700">
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">Nome *</p>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60"
                placeholder="Ex: Double Smash" />
            </div>

            <div className="col-span-2">
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">Descrição</p>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand-primary/60 resize-none"
                placeholder="Ingredientes, tamanho..." />
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">Preço (R$) *</p>
              <input value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60"
                placeholder="0,00" />
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">Categoria</p>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60">
                {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">URL da imagem</p>
              <input value={image} onChange={(e) => setImage(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60"
                placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-4">
            {[
              { label: "Disponível",     val: available, set: setAvailable },
              { label: "⭐ Destaque",    val: popular,   set: setPopular },
            ].map((toggle) => (
              <button
                key={toggle.label}
                onClick={() => toggle.set(!toggle.val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  toggle.val
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                    : "bg-neutral-700 border-neutral-600 text-neutral-400"
                }`}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors">
            {product ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Cardapio() {
  const { products, categories, toggleAvailability, togglePopular, deleteProduct } = useMenuStore();
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch]           = useState("");
  const [editing, setEditing]         = useState<Product | null | "new">(null);

  const filtered = products.filter((p) => {
    const matchCat  = selectedCat === "all" || p.category === selectedCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = {
    total:     products.length,
    available: products.filter((p) => p.available).length,
    popular:   products.filter((p) => p.popular).length,
    disabled:  products.filter((p) => !p.available).length,
  };

  return (
    <>
      {editing !== null && (
        <ProductModal
          product={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="flex flex-col h-full bg-neutral-900">
        {/* KPI bar */}
        <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800 shrink-0">
          {[
            { label: "Total de itens",  value: stats.total,     color: "text-blue-400" },
            { label: "Disponíveis",     value: stats.available, color: "text-green-400" },
            { label: "Destaques",       value: stats.popular,   color: "text-yellow-400" },
            { label: "Indisponíveis",   value: stats.disabled,  color: "text-red-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="px-6 py-4">
              <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-800 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-brand-primary/60"
            />
          </div>

          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCat === cat.id
                    ? "bg-brand-primary text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setEditing("new")}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold rounded-xl transition-colors"
          >
            + Novo Produto
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                className={`bg-neutral-800 border rounded-2xl overflow-hidden flex flex-col transition-all ${
                  product.available ? "border-neutral-700" : "border-neutral-800 opacity-60"
                }`}
              >
                {/* Image */}
                <div className="relative h-36 bg-neutral-700 shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                  {product.popular && (
                    <span className="absolute top-2 left-2 text-xs bg-yellow-500 text-neutral-900 font-bold px-2 py-0.5 rounded-full">
                      ⭐ Destaque
                    </span>
                  )}
                  {!product.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full">Indisponível</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-bold text-white leading-tight">{product.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 flex-1 leading-relaxed line-clamp-2">{product.description}</p>
                  <p className="text-base font-black text-brand-primary mt-2">R$ {fmt(product.price)}</p>
                </div>

                {/* Actions */}
                <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => toggleAvailability(product.id)}
                    title={product.available ? "Desativar" : "Ativar"}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      product.available
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-neutral-700 text-neutral-500 hover:bg-neutral-600"
                    }`}
                  >
                    {product.available ? "✓ Ativo" : "Off"}
                  </button>
                  <button
                    onClick={() => setEditing(product)}
                    className="py-1.5 rounded-lg text-xs font-medium bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir "${product.name}"?`)) deleteProduct(product.id); }}
                    className="py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-600">
              <span className="text-3xl mb-2">🍽️</span>
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
