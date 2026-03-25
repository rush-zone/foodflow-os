"use client";

import { useState, useMemo } from "react";
import { useEstoqueStore, StockCategory, StockItem, RestockRecord, getStockStatus } from "@/store/useEstoqueStore";
import { useSupplierStore, Supplier } from "@/store/useSupplierStore";
import { toast } from "@/store/useToastStore";

const CATEGORIES: StockCategory[] = ["carnes", "bebidas", "vegetais", "massas", "embalagens", "temperos"];

// ─── Novo Item Modal ──────────────────────────────────────────────────────────

function NovoItemModal({ onClose }: { onClose: () => void }) {
  const addItem = useEstoqueStore((s) => s.addItem);
  const [form, setForm] = useState<Omit<StockItem, "id" | "lastUpdated">>({
    name: "", category: "carnes", unit: "un",
    quantity: 0, minQuantity: 0, idealQuantity: 0, cost: 0, supplier: "",
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addItem(form);
    toast.success("Item adicionado", form.name);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white">Novo Item de Estoque</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-neutral-500 block mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Categoria</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value as StockCategory)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Unidade</label>
            <input value={form.unit} onChange={(e) => set("unit", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Qtd. Atual</label>
            <input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Qtd. Mínima</label>
            <input type="number" min={0} value={form.minQuantity} onChange={(e) => set("minQuantity", Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Qtd. Ideal</label>
            <input type="number" min={0} value={form.idealQuantity} onChange={(e) => set("idealQuantity", Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Custo/un (R$)</label>
            <input type="number" min={0} step="0.01" value={form.cost} onChange={(e) => set("cost", Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-neutral-500 block mb-1">Fornecedor</label>
            <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-neutral-500 hover:text-white border border-neutral-700 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-colors">
            Adicionar
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Restock Confirm Modal ────────────────────────────────────────────────────

function RestockConfirmModal({
  item,
  onConfirm,
  onCancel,
}: {
  item:      StockItem;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  const qty       = Math.max(0, item.idealQuantity - item.quantity);
  const totalCost = qty * item.cost;
  const fmtR      = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">

        {/* Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <span className="text-2xl">📦</span>
          </div>
          <div>
            <p className="text-sm font-black text-white">Confirmar reposição</p>
            <p className="text-xs text-neutral-400 mt-0.5">{item.name}</p>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-neutral-800 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Estoque atual</span>
            <span className="text-white">{item.quantity} {item.unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Repor até o ideal</span>
            <span className="text-white">{item.idealQuantity} {item.unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Quantidade a comprar</span>
            <span className="text-orange-400 font-bold">+{qty} {item.unit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Custo unitário</span>
            <span className="text-white">{fmtR(item.cost)}</span>
          </div>
          <div className="border-t border-neutral-700 pt-2 flex justify-between">
            <span className="text-sm font-bold text-white">Custo total estimado</span>
            <span className="text-sm font-black text-orange-400">{fmtR(totalCost)}</span>
          </div>
        </div>

        {/* Supplier */}
        <div className="flex items-center gap-2 bg-neutral-800/60 rounded-xl px-3 py-2.5">
          <span className="text-base">🏭</span>
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Fornecedor</p>
            <p className="text-sm font-semibold text-white">{item.supplier || "Não informado"}</p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 text-center">
          Este valor será registrado no histórico de gastos do estoque.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition-colors"
          >
            Repor · {fmtR(totalCost)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restock History Panel ────────────────────────────────────────────────────

function RestockHistoryPanel({ records }: { records: RestockRecord[] }) {
  const fmtR    = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const fmtDate = (d: Date) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
           " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
        <span className="text-3xl mb-2">🧾</span>
        <p className="text-sm">Nenhuma reposição registrada ainda.</p>
      </div>
    );
  }

  const totalGasto = records.reduce((s, r) => s + r.totalCost, 0);

  // Group by supplier for summary
  const bySupplier = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.supplier] = (acc[r.supplier] ?? 0) + r.totalCost;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary bar */}
      <div className="px-6 py-3 border-b border-neutral-800 shrink-0 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs text-neutral-500">Total gasto em reposições</p>
          <p className="text-lg font-black text-orange-400">{fmtR(totalGasto)}</p>
        </div>
        <div className="h-8 w-px bg-neutral-800" />
        <div className="flex gap-4 flex-wrap">
          {Object.entries(bySupplier).map(([supplier, total]) => (
            <div key={supplier} className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-medium">{supplier}</span>
              <span className="text-xs font-bold text-white">{fmtR(total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
            <tr className="text-xs text-neutral-500 text-left">
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Qtd. reposta</th>
              <th className="px-4 py-3 font-medium">Custo/un</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="px-6 py-3 text-neutral-100 font-medium">{r.itemName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-300 bg-neutral-800 px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                    🏭 {r.supplier || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-orange-400 font-bold text-xs">
                  +{r.qty} {r.unit}
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{fmtR(r.unitCost)}</td>
                <td className="px-4 py-3 text-white font-bold text-xs">{fmtR(r.totalCost)}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{fmtDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Supplier Form Modal ──────────────────────────────────────────────────────

function SupplierFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Supplier;
  onSave: (data: Omit<Supplier, "id">) => void;
  onClose: () => void;
}) {
  const blank = { name: "", contact: "", phone: "", email: "", category: "", notes: "" };
  const [form, setForm] = useState<Omit<Supplier, "id">>(initial ? { ...initial } : blank);

  function setF<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white">
            {initial ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-neutral-500 block mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => setF("name", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Responsável</label>
            <input value={form.contact} onChange={(e) => setF("contact", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Categoria</label>
            <input value={form.category} onChange={(e) => setF("category", e.target.value)}
              placeholder="ex: Frigorífico, Hortifruti..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Telefone</label>
            <input value={form.phone} onChange={(e) => setF("phone", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-neutral-500 block mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={2}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-neutral-500 hover:text-white border border-neutral-700 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-colors">
            {initial ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Fornecedores Panel ───────────────────────────────────────────────────────

function FornecedoresPanel() {
  const suppliers    = useSupplierStore((s) => s.suppliers);
  const addSupplier  = useSupplierStore((s) => s.add);
  const updSupplier  = useSupplierStore((s) => s.update);
  const remSupplier  = useSupplierStore((s) => s.remove);
  const stockItems   = useEstoqueStore((s) => s.items);

  const [modal, setModal] = useState<"new" | Supplier | null>(null);
  const [confirmDel, setConfirmDel] = useState<Supplier | null>(null);

  // Map: supplier name → stock items
  const itemsBySupplier = useMemo(() => {
    const map = new Map<string, typeof stockItems>();
    for (const item of stockItems) {
      const key = item.supplier.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [stockItems]);

  function getLinkedItems(name: string) {
    return itemsBySupplier.get(name.trim().toLowerCase()) ?? [];
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {modal === "new" && (
        <SupplierFormModal
          onSave={(data) => { addSupplier(data); toast.success("Fornecedor adicionado", data.name); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== "new" && (
        <SupplierFormModal
          initial={modal}
          onSave={(data) => { updSupplier(modal.id, data); toast.success("Fornecedor atualizado", data.name); }}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-bold">Remover fornecedor?</p>
            <p className="text-sm text-neutral-400">
              <span className="text-white font-medium">{confirmDel.name}</span> será removido. Os itens de estoque vinculados não serão alterados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { remSupplier(confirmDel.id); toast.info("Fornecedor removido", confirmDel.name); setConfirmDel(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-3 border-b border-neutral-800 shrink-0 flex items-center justify-between">
        <p className="text-xs text-neutral-500">{suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""} cadastrado{suppliers.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold rounded-lg transition-colors"
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
            <span className="text-3xl mb-2">🏭</span>
            <p className="text-sm">Nenhum fornecedor cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map((sup) => {
              const linked = getLinkedItems(sup.name);
              return (
                <div key={sup.id} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-neutral-600 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{sup.name}</p>
                      {sup.category && (
                        <span className="text-[10px] text-neutral-500 bg-neutral-700 px-2 py-0.5 rounded-full mt-1 inline-block">{sup.category}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal(sup)} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors" title="Editar">✏️</button>
                      <button onClick={() => setConfirmDel(sup)} className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-red-600/30 text-neutral-400 hover:text-red-400 flex items-center justify-center text-xs transition-colors" title="Remover">🗑️</button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1">
                    {sup.contact && (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span className="w-4 text-center">👤</span>
                        <span>{sup.contact}</span>
                      </div>
                    )}
                    {sup.phone && (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span className="w-4 text-center">📞</span>
                        <span>{sup.phone}</span>
                      </div>
                    )}
                    {sup.email && (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span className="w-4 text-center">✉️</span>
                        <span className="truncate">{sup.email}</span>
                      </div>
                    )}
                    {sup.notes && (
                      <div className="flex items-start gap-2 text-xs text-neutral-500 italic">
                        <span className="w-4 text-center mt-px">📝</span>
                        <span>{sup.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Linked stock items */}
                  {linked.length > 0 && (
                    <div className="border-t border-neutral-700 pt-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-2">
                        {linked.length} {linked.length === 1 ? "item vinculado" : "itens vinculados"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {linked.map((item) => (
                          <span key={item.id} className="text-[10px] text-neutral-300 bg-neutral-700 px-2 py-0.5 rounded-full">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── constants ────────────────────────────────────────────────────────────────

const categoryLabels: Record<StockCategory, { label: string; icon: string }> = {
  carnes:     { label: "Carnes",     icon: "🥩" },
  bebidas:    { label: "Bebidas",    icon: "🥤" },
  vegetais:   { label: "Vegetais",   icon: "🥗" },
  massas:     { label: "Massas",     icon: "🍞" },
  embalagens: { label: "Embalagens", icon: "📦" },
  temperos:   { label: "Temperos",   icon: "🧂" },
};

const statusConfig = {
  ok:       { label: "OK",       color: "text-green-400",  bg: "bg-green-400",  badge: "text-green-400 bg-green-400/10 border-green-400/30" },
  low:      { label: "Baixo",    color: "text-yellow-400", bg: "bg-yellow-400", badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  critical: { label: "Crítico",  color: "text-red-400",    bg: "bg-red-400",    badge: "text-red-400 bg-red-400/10 border-red-400/30" },
  out:      { label: "Esgotado", color: "text-red-500",    bg: "bg-red-500",    badge: "text-red-500 bg-red-500/10 border-red-500/30" },
};

// ─── main component ───────────────────────────────────────────────────────────

export default function Estoque() {
  const items          = useEstoqueStore((s) => s.items);
  const restockHistory = useEstoqueStore((s) => s.restockHistory);
  const _adjust        = useEstoqueStore((s) => s.adjust);
  const _restock       = useEstoqueStore((s) => s.restock);

  const [catFilter, setCatFilter]       = useState<StockCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "critical" | "out">("all");
  const [search, setSearch]             = useState("");
  const [showNovoItem, setShowNovoItem] = useState(false);
  const [restockItem, setRestockItem]   = useState<StockItem | null>(null);
  const [activeTab, setActiveTab]       = useState<"estoque" | "historico" | "fornecedores">("estoque");

  function adjust(id: string, delta: number) {
    _adjust(id, delta);
    const item = items.find((i) => i.id === id);
    if (item) toast.info(item.name, `${delta > 0 ? "+" : ""}${delta} ${item.unit}`);
  }

  function confirmRestock() {
    if (!restockItem) return;
    const record = _restock(restockItem.id);
    setRestockItem(null);
    if (record) {
      const fmtR = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
      toast.success(
        "Reposição registrada",
        `${record.itemName} · +${record.qty} ${record.unit} · ${fmtR(record.totalCost)}`
      );
    }
  }

  const filtered = useMemo(() => {
    return items
      .filter((i) => catFilter === "all" || i.category === catFilter)
      .filter((i) => statusFilter === "all" || getStockStatus(i) === statusFilter)
      .filter((i) => search.trim() === "" || i.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, catFilter, statusFilter, search]);

  const alerts      = items.filter((i) => ["low", "critical", "out"].includes(getStockStatus(i)));
  const totalValue  = items.reduce((s, i) => s + i.quantity * i.cost, 0);
  const totalSpent  = restockHistory.reduce((s, r) => s + r.totalCost, 0);
  const fmtR        = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {showNovoItem && <NovoItemModal onClose={() => setShowNovoItem(false)} />}
      {restockItem  && (
        <RestockConfirmModal
          item={restockItem}
          onConfirm={confirmRestock}
          onCancel={() => setRestockItem(null)}
        />
      )}

      {/* KPI bar */}
      <div className="grid grid-cols-5 divide-x divide-neutral-800 border-b border-neutral-800 shrink-0">
        {[
          { label: "Total de Itens",       value: String(items.length),                                   color: "text-blue-400" },
          { label: "Alertas",              value: String(alerts.length),                                  color: alerts.length > 0 ? "text-red-400" : "text-green-400" },
          { label: "Itens Esgotados",      value: String(items.filter((i) => getStockStatus(i) === "out").length), color: "text-red-400" },
          { label: "Valor em Estoque",     value: fmtR(totalValue),                                       color: "text-brand-primary" },
          { label: "Gastos em Reposição",  value: fmtR(totalSpent),                                       color: "text-orange-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-4 py-3">
            <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
            <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="px-6 py-2.5 bg-red-500/5 border-b border-red-500/20 flex items-center gap-3 shrink-0">
          <span className="text-red-400 text-xs font-bold">⚠ {alerts.length} {alerts.length === 1 ? "item precisa" : "itens precisam"} de reposição:</span>
          <div className="flex gap-2 flex-wrap">
            {alerts.slice(0, 5).map((a) => (
              <span key={a.id} className="text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full">{a.name}</span>
            ))}
            {alerts.length > 5 && <span className="text-xs text-neutral-500">+{alerts.length - 5}</span>}
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-800 shrink-0 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-800 rounded-lg p-0.5 shrink-0">
          {(["estoque", "historico", "fornecedores"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab ? "bg-neutral-600 text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab === "estoque"
                ? "📦 Estoque"
                : tab === "historico"
                ? `🧾 Reposições${restockHistory.length > 0 ? ` (${restockHistory.length})` : ""}`
                : "🏭 Fornecedores"}
            </button>
          ))}
        </div>

        {activeTab === "estoque" && (
          <>
            {/* Category filters */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCatFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === "all" ? "bg-brand-primary text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
              >
                Todos
              </button>
              {Object.entries(categoryLabels).map(([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setCatFilter(key as StockCategory)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === key ? "bg-brand-primary text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-neutral-700" />

            {/* Status filters */}
            {(["all", "low", "critical", "out"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"}`}
              >
                {s === "all" ? "Todos status" : statusConfig[s].label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg pl-8 pr-4 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-brand-primary/50 w-52 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowNovoItem(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold rounded-lg transition-colors"
              >
                + Novo Item
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === "fornecedores" ? (
        <FornecedoresPanel />
      ) : activeTab === "historico" ? (
        <RestockHistoryPanel records={restockHistory} />
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
              <tr className="text-xs text-neutral-500 text-left">
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium w-36">Nível</th>
                <th className="px-4 py-3 font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Custo/un</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((item) => {
                const st  = getStockStatus(item);
                const sc  = statusConfig[st];
                const pct = Math.min(100, (item.quantity / item.idealQuantity) * 100);
                const restockCost = Math.max(0, item.idealQuantity - item.quantity) * item.cost;

                return (
                  <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors group">
                    <td className="px-6 py-3.5 font-medium text-neutral-100">{item.name}</td>
                    <td className="px-4 py-3.5 text-neutral-400 text-xs">
                      {categoryLabels[item.category].icon} {categoryLabels[item.category].label}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-neutral-200 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit whitespace-nowrap">
                        🏭 {item.supplier || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold ${sc.color}`}>
                        {item.quantity} <span className="text-neutral-500 font-normal text-xs">{item.unit}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 w-36">
                      <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${sc.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 text-xs">{item.minQuantity} {item.unit}</td>
                    <td className="px-4 py-3.5 text-neutral-400 text-xs">{fmtR(item.cost)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => adjust(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 text-neutral-300 flex items-center justify-center text-sm transition-colors"
                        >−</button>
                        <button
                          onClick={() => adjust(item.id, 1)}
                          className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 text-neutral-300 flex items-center justify-center text-sm transition-colors"
                        >+</button>
                        <button
                          onClick={() => setRestockItem(item)}
                          disabled={item.quantity >= item.idealQuantity}
                          title={`Repor até ${item.idealQuantity} ${item.unit} · custo estimado ${fmtR(restockCost)}`}
                          className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed border border-orange-400/30 hover:border-orange-400/60 px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Repor · {fmtR(restockCost)}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
              <span className="text-3xl mb-2">📦</span>
              <p className="text-sm">Nenhum item encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
