"use client";

import { useState, useMemo } from "react";
import { useEstoqueStore, StockCategory, getStockStatus } from "@/store/useEstoqueStore";

const categoryLabels: Record<StockCategory, { label: string; icon: string }> = {
  carnes:     { label: "Carnes",      icon: "🥩" },
  bebidas:    { label: "Bebidas",     icon: "🥤" },
  vegetais:   { label: "Vegetais",    icon: "🥗" },
  massas:     { label: "Massas",      icon: "🍞" },
  embalagens: { label: "Embalagens",  icon: "📦" },
  temperos:   { label: "Temperos",    icon: "🧂" },
};

const statusConfig = {
  ok:       { label: "OK",       color: "text-green-400",  bg: "bg-green-400",  badge: "text-green-400 bg-green-400/10 border-green-400/30" },
  low:      { label: "Baixo",    color: "text-yellow-400", bg: "bg-yellow-400", badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  critical: { label: "Crítico",  color: "text-red-400",    bg: "bg-red-400",    badge: "text-red-400 bg-red-400/10 border-red-400/30" },
  out:      { label: "Esgotado", color: "text-red-500",    bg: "bg-red-500",    badge: "text-red-500 bg-red-500/10 border-red-500/30" },
};

export default function Estoque() {
  const items = useEstoqueStore((s) => s.items);
  const adjust = useEstoqueStore((s) => s.adjust);
  const restock = useEstoqueStore((s) => s.restock);

  const [catFilter, setCatFilter] = useState<StockCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "critical" | "out">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items
      .filter((i) => catFilter === "all" || i.category === catFilter)
      .filter((i) => {
        if (statusFilter === "all") return true;
        return getStockStatus(i) === statusFilter;
      })
      .filter((i) =>
        search.trim() === "" || i.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [items, catFilter, statusFilter, search]);

  const alerts = items.filter((i) => ["low", "critical", "out"].includes(getStockStatus(i)));
  const totalValue = items.reduce((s, i) => s + i.quantity * i.cost, 0);

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">FF</div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
              📦 Estoque
            </span>
          </div>
        </div>
      </header>

      {/* KPI bar */}
      <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800 shrink-0">
        {[
          { label: "Total de Itens",    value: String(items.length),                     color: "text-blue-400" },
          { label: "Alertas",           value: String(alerts.length),                    color: alerts.length > 0 ? "text-red-400" : "text-green-400" },
          { label: "Valor em Estoque",  value: `R$ ${totalValue.toFixed(2).replace(".", ",")}`, color: "text-brand-primary" },
          { label: "Itens Esgotados",   value: String(items.filter((i) => getStockStatus(i) === "out").length), color: "text-red-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-6 py-4">
            <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="px-6 py-2.5 bg-red-500/5 border-b border-red-500/20 flex items-center gap-3 shrink-0">
          <span className="text-red-400 text-xs font-bold">⚠ {alerts.length} {alerts.length === 1 ? "item precisa" : "itens precisam"} de reposição:</span>
          <div className="flex gap-2 flex-wrap">
            {alerts.slice(0, 5).map((a) => (
              <span key={a.id} className="text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full">
                {a.name}
              </span>
            ))}
            {alerts.length > 5 && <span className="text-xs text-neutral-500">+{alerts.length - 5}</span>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-800 shrink-0 flex-wrap">
        {/* Category */}
        <div className="flex gap-1.5">
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

        {/* Status */}
        {(["all", "low", "critical", "out"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"}`}
          >
            {s === "all" ? "Todos status" : statusConfig[s].label}
          </button>
        ))}

        <div className="ml-auto relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg pl-8 pr-4 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-brand-primary/50 w-52 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
            <tr className="text-xs text-neutral-500 text-left">
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Quantidade</th>
              <th className="px-4 py-3 font-medium w-48">Nível</th>
              <th className="px-4 py-3 font-medium">Mínimo</th>
              <th className="px-4 py-3 font-medium">Custo/un</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.map((item) => {
              const st = getStockStatus(item);
              const sc = statusConfig[st];
              const pct = Math.min(100, (item.quantity / item.idealQuantity) * 100);

              return (
                <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-6 py-3.5 font-medium text-neutral-100">{item.name}</td>
                  <td className="px-4 py-3.5 text-neutral-400 text-xs">
                    {categoryLabels[item.category].icon} {categoryLabels[item.category].label}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-bold ${sc.color}`}>
                      {item.quantity} <span className="text-neutral-500 font-normal text-xs">{item.unit}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 w-48">
                    <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${sc.bg}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500 text-xs">{item.minQuantity} {item.unit}</td>
                  <td className="px-4 py-3.5 text-neutral-400 text-xs">
                    R$ {item.cost.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500 text-xs">{item.supplier}</td>
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
                        onClick={() => restock(item.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        Repor
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
    </div>
  );
}
