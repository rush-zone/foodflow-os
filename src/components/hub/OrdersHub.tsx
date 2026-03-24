"use client";

import { useState, useMemo } from "react";
import { useFlowStore, FlowStatus, FlowPlatform, OrderType } from "@/store/useFlowStore";
import { toast } from "@/store/useToastStore";
import HubStatusBadge from "./HubStatusBadge";
import HubOrderDrawer from "./HubOrderDrawer";

const typeIcon: Record<OrderType, string> = {
  local: "🪑", delivery: "🏍️", takeaway: "🥡",
};

const platformConfig: Record<FlowPlatform, { label: string; color: string; bg: string }> = {
  proprio:  { label: "Próprio",  color: "text-brand-primary", bg: "bg-brand-primary/10 border-brand-primary/30" },
  ifood:    { label: "iFood",    color: "text-red-400",        bg: "bg-red-400/10 border-red-400/30" },
  rappi:    { label: "Rappi",    color: "text-orange-400",     bg: "bg-orange-400/10 border-orange-400/30" },
  anota_ai: { label: "Anota AI", color: "text-blue-400",       bg: "bg-blue-400/10 border-blue-400/30" },
  whatsapp: { label: "WhatsApp", color: "text-green-400",      bg: "bg-green-400/10 border-green-400/30" },
};

function PlatformBadge({ platform }: { platform: FlowPlatform }) {
  const { label, color, bg } = platformConfig[platform];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg}`}>
      {label}
    </span>
  );
}

const statusTabs: { value: FlowStatus | "all"; label: string }[] = [
  { value: "all",        label: "Todos" },
  { value: "pending",    label: "Aguardando" },
  { value: "preparing",  label: "Em Preparo" },
  { value: "ready",      label: "Prontos" },
  { value: "picked_up",  label: "Coletado" },
  { value: "on_the_way", label: "A Caminho" },
  { value: "delivered",  label: "Entregues" },
  { value: "cancelled",  label: "Cancelados" },
];

function elapsed(from: Date, to?: Date) {
  const ms = (to ?? new Date()).getTime() - from.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

const paymentLabel: Record<string, string> = {
  pix: "PIX", card: "Cartão", cash: "Dinheiro",
};

function exportCSV(rows: ReturnType<typeof useFlowStore.getState>["orders"]) {
  const header = ["#", "Cliente", "Plataforma", "Tipo", "Total", "Pagamento", "Status", "Criado", "Fechado"];
  const lines = rows.map((o) => [
    o.number,
    `"${o.customer}"`,
    o.platform,
    o.type,
    o.total.toFixed(2),
    o.paymentMethod,
    o.status,
    o.createdAt.toISOString(),
    o.closedAt?.toISOString() ?? "",
  ].join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado", `${rows.length} pedidos`);
}

export default function OrdersHub() {
  const orders      = useFlowStore((s) => s.orders);
  const _cancelOrder = useFlowStore((s) => s.cancelOrder);

  function cancelOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    _cancelOrder(id);
    if (order) toast.warning("Pedido cancelado", `#${order.number} — ${order.customer}`);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  const [statusFilter, setStatusFilter] = useState<FlowStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<FlowPlatform | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => platformFilter === "all" || o.platform === platformFilter)
      .filter((o) =>
        search.trim() === "" ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        String(o.number).includes(search)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, statusFilter, platformFilter, search]);

  const totalRevenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const activeCount = orders.filter((o) => ["pending", "preparing", "ready", "picked_up", "on_the_way"].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const avgTicket = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {selectedOrder && (
        <HubOrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedId(null)}
          onCancel={(id) => { cancelOrder(id); setSelectedId(null); }}
        />
      )}
      <header className="flex items-center justify-between px-6 py-2 border-b border-neutral-800 shrink-0">
        <p className="text-xs text-neutral-500">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium rounded-lg border border-neutral-700 transition-all"
        >
          ⬇ Exportar CSV
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800 shrink-0">
        {[
          { label: "Receita do Dia",  value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, color: "text-green-400" },
          { label: "Pedidos Ativos",  value: String(activeCount),    color: "text-yellow-400" },
          { label: "Entregues Hoje",  value: String(deliveredCount), color: "text-blue-400" },
          { label: "Ticket Médio",    value: `R$ ${avgTicket.toFixed(2).replace(".", ",")}`,    color: "text-brand-primary" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-6 py-4">
            <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs.map((tab) => {
            const count = tab.value === "all" ? orders.length : orders.filter((o) => o.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === tab.value ? "bg-brand-primary text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {tab.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
          <div className="h-4 w-px bg-neutral-700" />
          <button
            onClick={() => setPlatformFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${platformFilter === "all" ? "bg-neutral-600 text-white border-transparent" : "bg-neutral-800 text-neutral-500 border-transparent hover:bg-neutral-700"}`}
          >
            Todas plataformas
          </button>
          {(Object.keys(platformConfig) as FlowPlatform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                platformFilter === p
                  ? `${platformConfig[p].color} ${platformConfig[p].bg}`
                  : "bg-neutral-800 text-neutral-500 border-transparent hover:bg-neutral-700"
              }`}
            >
              {platformConfig[p].label} <span className="opacity-60">{orders.filter((o) => o.platform === p).length}</span>
            </button>
          ))}
          <div className="ml-auto relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg pl-8 pr-4 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-brand-primary/50 w-64 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
            <tr className="text-xs text-neutral-500 text-left">
              <th className="px-6 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente / Mesa</th>
              <th className="px-4 py-3 font-medium">Plataforma</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Itens</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Tempo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={`hover:bg-neutral-800/40 transition-colors group cursor-pointer ${
                  selectedId === order.id ? "bg-neutral-800/60 ring-1 ring-inset ring-brand-primary/30" : ""
                }`}
              >
                <td className="px-6 py-3.5"><span className="font-bold text-neutral-100">#{order.number}</span></td>
                <td className="px-4 py-3.5 text-neutral-300">{order.customer}</td>
                <td className="px-4 py-3.5"><PlatformBadge platform={order.platform} /></td>
                <td className="px-4 py-3.5"><span className="text-lg" title={order.type}>{typeIcon[order.type]}</span></td>
                <td className="px-4 py-3.5 text-neutral-400 text-xs">
                  {order.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  {order.items.length > 2 && ` +${order.items.length - 2}`}
                </td>
                <td className="px-4 py-3.5 font-bold text-neutral-100">R$ {order.total.toFixed(2).replace(".", ",")}</td>
                <td className="px-4 py-3.5 text-neutral-400 text-xs">{paymentLabel[order.paymentMethod] ?? order.paymentMethod}</td>
                <td className="px-4 py-3.5 text-neutral-500 text-xs tabular-nums">{elapsed(order.createdAt, order.closedAt)}</td>
                <td className="px-4 py-3.5"><HubStatusBadge status={order.status} /></td>
                <td className="px-4 py-3.5">
                  {!["delivered", "cancelled"].includes(order.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                      className="text-xs text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
