"use client";

import { useState, useMemo } from "react";
import { useOrdersHubStore, HubOrderStatus, HubOrderType } from "@/store/useOrdersHubStore";
import HubStatusBadge from "./HubStatusBadge";

const typeIcon: Record<HubOrderType, string> = {
  local: "🪑", delivery: "🏍️", takeaway: "🥡",
};

const statusTabs: { value: HubOrderStatus | "all"; label: string }[] = [
  { value: "all",       label: "Todos" },
  { value: "pending",   label: "Aguardando" },
  { value: "preparing", label: "Em Preparo" },
  { value: "ready",     label: "Prontos" },
  { value: "delivered", label: "Entregues" },
  { value: "cancelled", label: "Cancelados" },
];

function elapsed(from: Date, to?: Date) {
  const ms = (to ?? new Date()).getTime() - from.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

export default function OrdersHub() {
  const orders = useOrdersHubStore((s) => s.orders);
  const cancelOrder = useOrdersHubStore((s) => s.cancelOrder);

  const [statusFilter, setStatusFilter] = useState<HubOrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) =>
        search.trim() === "" ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        String(o.number).includes(search)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, statusFilter, search]);

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0);
  const activeCount = orders.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const avgTicket = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">FF</div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
              📋 Hub de Pedidos
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </header>

      {/* KPI bar */}
      <div className="grid grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800 shrink-0">
        {[
          { label: "Receita do Dia", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, color: "text-green-400" },
          { label: "Pedidos Ativos",  value: String(activeCount),   color: "text-yellow-400" },
          { label: "Entregues Hoje",  value: String(deliveredCount), color: "text-blue-400" },
          { label: "Ticket Médio",    value: `R$ ${avgTicket.toFixed(2).replace(".", ",")}`, color: "text-brand-primary" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-6 py-4">
            <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex gap-1.5">
          {statusTabs.map((tab) => {
            const count = tab.value === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === tab.value
                    ? "bg-brand-primary text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

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

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
            <tr className="text-xs text-neutral-500 text-left">
              <th className="px-6 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente / Mesa</th>
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
              <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors group">
                <td className="px-6 py-3.5">
                  <span className="font-bold text-neutral-100">#{order.number}</span>
                </td>
                <td className="px-4 py-3.5 text-neutral-300">{order.customer}</td>
                <td className="px-4 py-3.5">
                  <span title={order.type} className="text-lg">{typeIcon[order.type]}</span>
                </td>
                <td className="px-4 py-3.5 text-neutral-400 text-xs">
                  {order.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  {order.items.length > 2 && ` +${order.items.length - 2}`}
                </td>
                <td className="px-4 py-3.5 font-bold text-neutral-100">
                  R$ {order.total.toFixed(2).replace(".", ",")}
                </td>
                <td className="px-4 py-3.5 text-neutral-400 text-xs">{order.paymentMethod}</td>
                <td className="px-4 py-3.5 text-neutral-500 text-xs tabular-nums">
                  {elapsed(order.createdAt, order.closedAt)}
                </td>
                <td className="px-4 py-3.5">
                  <HubStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3.5">
                  {!["delivered", "cancelled"].includes(order.status) && (
                    <button
                      onClick={() => cancelOrder(order.id)}
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
