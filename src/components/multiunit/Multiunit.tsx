"use client";

import { useState } from "react";
import { useMultiunitStore } from "@/store/useMultiunitStore";
import UnitList from "./UnitList";
import UnitDashboard from "./UnitDashboard";
import UnitCompare from "./UnitCompare";

export default function Multiunit() {
  const units = useMultiunitStore((s) => s.units);
  const [view, setView] = useState<"unit" | "compare">("unit");

  const totalAlerts = units.reduce((s, u) => s + u.alerts.length, 0);
  const openUnits   = units.filter((u) => u.status !== "closed").length;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500 text-xs">
            <span className="text-green-400 font-bold">{openUnits}</span>/{units.length} unidades abertas
          </span>
          {totalAlerts > 0 && (
            <span className="text-xs text-red-400 font-bold bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-full">
              ⚠ {totalAlerts} {totalAlerts === 1 ? "alerta" : "alertas"} na rede
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setView("unit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "unit" ? "bg-brand-primary text-white" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Por Unidade
          </button>
          <button
            onClick={() => setView("compare")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "compare" ? "bg-brand-primary text-white" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Comparativo
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden divide-x divide-neutral-800">
        {/* Unit list */}
        <div className="w-72 shrink-0 overflow-hidden flex flex-col">
          <UnitList />
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-hidden">
          {view === "unit" ? <UnitDashboard /> : <UnitCompare />}
        </div>
      </div>
    </div>
  );
}
