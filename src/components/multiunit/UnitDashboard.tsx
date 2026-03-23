"use client";

import { useMultiunitStore } from "@/store/useMultiunitStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const alertIcon: Record<string, string> = {
  stock: "📦", delivery: "🏍️", kds: "🍳", system: "⚙️",
};

const severityColor: Record<string, string> = {
  info:     "border-blue-500/30 bg-blue-500/5 text-blue-400",
  warning:  "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
  critical: "border-red-500/30 bg-red-500/5 text-red-400",
};

const tooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

function delta(current: number, previous: number) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return { text: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export default function UnitDashboard() {
  const units = useMultiunitStore((s) => s.units);
  const selectedId = useMultiunitStore((s) => s.selectedId);
  const dismissAlert = useMultiunitStore((s) => s.dismissAlert);

  const unit = units.find((u) => u.id === selectedId);
  if (!unit) return null;

  const weekDelta = delta(unit.weekRevenue, unit.weekRevenueLastWeek);
  const staffOnDuty = unit.staff.filter((s) => s.clockedIn);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Unit header */}
      <div className="px-6 py-5 border-b border-neutral-800 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-neutral-100">{unit.name}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {unit.address} · {unit.neighborhood}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Gerente: {unit.manager} · {unit.phone} · {unit.openAt}–{unit.closeAt}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 mb-1">Receita semanal</p>
            <p className="text-xl font-black text-neutral-100">
              R$ {(unit.weekRevenue / 1000).toFixed(1)}k
            </p>
            {weekDelta && (
              <p className={`text-xs font-bold ${weekDelta.positive ? "text-green-400" : "text-red-400"}`}>
                {weekDelta.text} vs semana anterior
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Today KPIs */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Hoje</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Receita",    value: `R$ ${unit.todayRevenue.toFixed(0)}`,  color: "text-green-400",  icon: "💰" },
              { label: "Pedidos",    value: String(unit.todayOrders),               color: "text-blue-400",   icon: "📋" },
              { label: "Ticket Médio", value: `R$ ${unit.todayAvgTicket.toFixed(0)}`, color: "text-brand-primary", icon: "🎯" },
              { label: "Deliveries", value: String(unit.todayDeliveries),           color: "text-orange-400", icon: "🏍️" },
              { label: "Ativos",     value: String(unit.activeOrders),              color: unit.activeOrders > 10 ? "text-yellow-400" : "text-neutral-100", icon: "⚡" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-center">
                <div className="text-lg mb-1">{kpi.icon}</div>
                <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        {unit.alerts.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
              Alertas
              <span className="ml-2 text-red-400 font-bold">{unit.alerts.length}</span>
            </h3>
            <div className="space-y-2">
              {unit.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between gap-3 border rounded-xl px-4 py-3 ${severityColor[alert.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">{alertIcon[alert.type]}</span>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => dismissAlert(unit.id, alert.id)}
                    className="text-xs opacity-50 hover:opacity-100 shrink-0 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hourly chart */}
        {unit.hourly.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Pedidos por Hora</h3>
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={unit.hourly} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Staff */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
            Equipe
            <span className="ml-2 text-neutral-400 font-normal">
              {staffOnDuty.length}/{unit.staff.length} em serviço
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {unit.staff.map((member) => (
              <div
                key={member.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  member.clockedIn
                    ? "bg-neutral-800 border-neutral-700"
                    : "bg-neutral-800/40 border-neutral-800 opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  member.clockedIn ? "bg-brand-primary/20 text-brand-primary" : "bg-neutral-700 text-neutral-500"
                }`}>
                  {member.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-200 truncate">{member.name}</p>
                  <p className="text-xs text-neutral-500">{member.role}</p>
                </div>
                <span className={`ml-auto text-xs shrink-0 ${member.clockedIn ? "text-green-400" : "text-neutral-600"}`}>
                  {member.clockedIn ? "● Presente" : "○ Fora"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
