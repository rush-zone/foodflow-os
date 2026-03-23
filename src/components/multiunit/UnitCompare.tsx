"use client";

import { useMultiunitStore } from "@/store/useMultiunitStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

const COLORS = ["#FF5A1F", "#6366F1", "#22D3EE", "#F59E0B"];

export default function UnitCompare() {
  const units = useMultiunitStore((s) => s.units);

  const revenueData = units.map((u) => ({
    name: u.name,
    "Hoje": u.todayRevenue,
    "Semana": u.weekRevenue,
  }));

  const ordersData = units.map((u) => ({
    name: u.name,
    Pedidos: u.todayOrders,
    Deliveries: u.todayDeliveries,
  }));

  const best = [...units].sort((a, b) => b.todayRevenue - a.todayRevenue)[0];
  const networkRevenue = units.reduce((s, u) => s + u.todayRevenue, 0);
  const networkOrders  = units.reduce((s, u) => s + u.todayOrders, 0);
  const networkAvg     = networkOrders > 0 ? networkRevenue / networkOrders : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div className="px-5 py-4 border-b border-neutral-800 shrink-0">
        <h3 className="text-sm font-bold text-neutral-100">Comparativo de Unidades</h3>
        <p className="text-xs text-neutral-500 mt-0.5">Performance consolidada da rede</p>
      </div>

      <div className="p-5 space-y-6">
        {/* Network totals */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Receita Total Hoje", value: `R$ ${networkRevenue.toFixed(0)}`, color: "text-green-400" },
            { label: "Pedidos Totais",     value: String(networkOrders),              color: "text-blue-400" },
            { label: "Ticket Médio Rede",  value: `R$ ${networkAvg.toFixed(2).replace(".", ",")}`, color: "text-brand-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center">
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Best unit */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-bold text-yellow-400">Destaque do dia: {best.name}</p>
            <p className="text-xs text-neutral-400">
              R$ {best.todayRevenue.toFixed(0)} · {best.todayOrders} pedidos · {best.todayDeliveries} deliveries
            </p>
          </div>
        </div>

        {/* Revenue comparison */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Receita por Unidade</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(0)}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#9CA3AF" }} />
              <Bar dataKey="Hoje"   fill="#FF5A1F" radius={[3, 3, 0, 0]} barSize={18} />
              <Bar dataKey="Semana" fill="#6366F1" radius={[3, 3, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders comparison */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Pedidos vs Deliveries</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={ordersData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#9CA3AF" }} />
              <Bar dataKey="Pedidos"    fill="#22D3EE" radius={[3, 3, 0, 0]} barSize={18} />
              <Bar dataKey="Deliveries" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking table */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-700">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ranking Hoje</h4>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-600 text-left">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Unidade</th>
                <th className="px-4 py-2 font-medium">Receita</th>
                <th className="px-4 py-2 font-medium">Pedidos</th>
                <th className="px-4 py-2 font-medium">Ticket</th>
                <th className="px-4 py-2 font-medium">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {[...units]
                .sort((a, b) => b.todayRevenue - a.todayRevenue)
                .map((unit, i) => (
                  <tr key={unit.id} className="hover:bg-neutral-700/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`font-black ${i === 0 ? "text-yellow-400" : "text-neutral-600"}`}>
                        {i === 0 ? "🥇" : `${i + 1}°`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-neutral-200">{unit.name}</td>
                    <td className="px-4 py-2.5 font-bold text-green-400">R$ {unit.todayRevenue.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-neutral-300">{unit.todayOrders}</td>
                    <td className="px-4 py-2.5 text-neutral-300">R$ {unit.todayAvgTicket.toFixed(0)}</td>
                    <td className="px-4 py-2.5">
                      {unit.alerts.length > 0 ? (
                        <span className="text-red-400 font-bold">⚠ {unit.alerts.length}</span>
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
