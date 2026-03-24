"use client";

import { useMultiunitStore, UnitStatus } from "@/store/useMultiunitStore";
import { useFlowStore } from "@/store/useFlowStore";

const statusConfig: Record<UnitStatus, { label: string; color: string; dot: string }> = {
  open:   { label: "Aberta",  color: "text-green-400",  dot: "bg-green-400" },
  busy:   { label: "Lotada",  color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
  alert:  { label: "Alerta",  color: "text-red-400",    dot: "bg-red-400 animate-pulse" },
  closed: { label: "Fechada", color: "text-neutral-500", dot: "bg-neutral-600" },
};

export default function UnitList() {
  const units      = useMultiunitStore((s) => s.units);
  const selectedId = useMultiunitStore((s) => s.selectedId);
  const select     = useMultiunitStore((s) => s.select);
  const flowOrders = useFlowStore((s) => s.orders);

  // Live metrics for u1 from flowOrders
  const u1LiveRevenue = flowOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const u1LiveOrders  = flowOrders.filter((o) => o.status !== "cancelled").length;

  const totalRevenue = units.reduce((s, u) => s + (u.id === "u1" ? u1LiveRevenue : u.todayRevenue), 0);
  const totalOrders  = units.reduce((s, u) => s + (u.id === "u1" ? u1LiveOrders  : u.todayOrders),  0);
  const totalAlerts  = units.reduce((s, u) => s + u.alerts.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Network summary */}
      <div className="px-4 py-4 border-b border-neutral-800 shrink-0">
        <p className="text-xs text-neutral-500 mb-3 font-medium uppercase tracking-widest">Rede FoodFlow</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Receita",  value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, color: "text-green-400" },
            { label: "Pedidos",  value: String(totalOrders), color: "text-blue-400" },
            { label: "Alertas",  value: String(totalAlerts), color: totalAlerts > 0 ? "text-red-400" : "text-neutral-500" },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-800 rounded-xl p-2.5 text-center">
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-neutral-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unit cards */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {units.map((unit) => {
          const sc = statusConfig[unit.status];
          const isSelected = selectedId === unit.id;
          const liveRevenue = unit.id === "u1" ? u1LiveRevenue : unit.todayRevenue;
          const liveOrders  = unit.id === "u1" ? u1LiveOrders  : unit.todayOrders;
          const liveActive  = unit.id === "u1"
            ? flowOrders.filter((o) => ["pending","preparing","ready","picked_up","on_the_way"].includes(o.status)).length
            : unit.activeOrders;

          return (
            <button
              key={unit.id}
              onClick={() => select(unit.id)}
              className={`w-full text-left px-4 py-4 border-b border-neutral-800 transition-colors ${
                isSelected ? "bg-brand-primary/5 border-l-2 border-l-brand-primary" : "hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-neutral-100">{unit.name}</p>
                  <p className="text-xs text-neutral-500">{unit.neighborhood} · {unit.city}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              {unit.status !== "closed" ? (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <p className="text-xs font-bold text-neutral-100">R$ {(liveRevenue / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-neutral-600">receita</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-100">{liveOrders}</p>
                    <p className="text-xs text-neutral-600">pedidos</p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${liveActive > 10 ? "text-yellow-400" : "text-neutral-100"}`}>
                      {liveActive}
                    </p>
                    <p className="text-xs text-neutral-600">ativos</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-600 mt-1">
                  Abre às {unit.openAt} · Gerente: {unit.manager}
                </p>
              )}

              {unit.alerts.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-red-400 font-medium">
                    ⚠ {unit.alerts.length} {unit.alerts.length === 1 ? "alerta" : "alertas"}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
