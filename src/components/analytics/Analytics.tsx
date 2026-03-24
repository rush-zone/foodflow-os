"use client";

import { useState, useMemo } from "react";
import { useFlowStore, FlowOrder } from "@/store/useFlowStore";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

type Period = "Hoje" | "Semana" | "Mês";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function startOfDay(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function deltaPct(cur: number, prev: number): { text: string; positive: boolean } {
  if (prev === 0) return { text: cur > 0 ? "+100%" : "—", positive: cur >= 0 };
  const p = ((cur - prev) / prev) * 100;
  return { text: `${p >= 0 ? "+" : ""}${p.toFixed(0)}%`, positive: p >= 0 };
}

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

// ─── Hook: derive all chart data from real orders ─────────────────────────────
function useDerivedAnalytics(period: Period) {
  const orders = useFlowStore((s) => s.orders);

  return useMemo(() => {
    const now = Date.now();
    const SOD = startOfDay(now);

    // Current and previous window bounds
    const curStart  = period === "Hoje"   ? SOD
                    : period === "Semana" ? now - 7  * 86400000
                    :                       now - 30 * 86400000;
    const prevStart = period === "Hoje"   ? SOD - 86400000
                    : period === "Semana" ? now - 14 * 86400000
                    :                       now - 60 * 86400000;
    const prevEnd   = curStart;

    const cur  = orders.filter((o) => o.createdAt.getTime() >= curStart  && o.status !== "cancelled");
    const prev = orders.filter((o) => o.createdAt.getTime() >= prevStart && o.createdAt.getTime() < prevEnd && o.status !== "cancelled");

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const revenue     = cur.reduce((s, o) => s + o.total, 0);
    const prevRevenue = prev.reduce((s, o) => s + o.total, 0);
    const count       = cur.length;
    const prevCount   = prev.length;
    const avgTicket   = count > 0 ? revenue / count : 0;
    const prevAvg     = prevCount > 0 ? prevRevenue / prevCount : 0;
    const allCur      = orders.filter((o) => o.createdAt.getTime() >= curStart);
    const cancelCount = allCur.filter((o) => o.status === "cancelled").length;
    const cancelRate  = allCur.length > 0 ? (cancelCount / allCur.length) * 100 : 0;

    const revDelta = deltaPct(revenue, prevRevenue);
    const cntDelta = deltaPct(count,   prevCount);
    const avgDelta = deltaPct(avgTicket, prevAvg);

    const periodLabel = period === "Hoje" ? "Hoje" : period === "Semana" ? "Semanal" : "do Mês";

    const kpis = [
      { label: `Receita ${periodLabel}`,   value: `R$ ${revenue.toFixed(0)}`,          delta: revDelta.text, positive: revDelta.positive, icon: "💰" },
      { label: `Pedidos ${periodLabel}`,   value: String(count),                         delta: cntDelta.text, positive: cntDelta.positive, icon: "📋" },
      { label: "Ticket Médio",             value: `R$ ${fmt(avgTicket)}`,                delta: avgDelta.text, positive: avgDelta.positive, icon: "🎯" },
      { label: "Cancelamentos",            value: `${cancelRate.toFixed(1)}%`,           delta: "—",           positive: cancelRate < 5,    icon: "❌" },
      { label: "Delivery / Total",         value: `${count > 0 ? Math.round(cur.filter((o) => o.type === "delivery").length / count * 100) : 0}%`, delta: "—", positive: true, icon: "🏍️" },
      { label: "Avaliação Média",          value: "4,9 ⭐",                              delta: "—",           positive: true,              icon: "⭐" },
    ];

    // ── Revenue chart ─────────────────────────────────────────────────────────
    const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    function bucket<K extends string>(
      rows: FlowOrder[],
      keyFn: (o: FlowOrder) => K,
      sortFn?: (a: K, b: K) => number,
    ): { day: string; revenue: number; orders: number }[] {
      const map: Record<string, { revenue: number; orders: number }> = {};
      rows.forEach((o) => {
        const k = keyFn(o);
        if (!map[k]) map[k] = { revenue: 0, orders: 0 };
        map[k].revenue += o.total;
        map[k].orders  += 1;
      });
      const entries = Object.entries(map) as [K, { revenue: number; orders: number }][];
      if (sortFn) entries.sort((a, b) => sortFn(a[0], b[0]));
      return entries.map(([k, v]) => ({ day: k, ...v }));
    }

    let revenueData;
    if (period === "Hoje") {
      revenueData = bucket(cur, (o) => `${o.createdAt.getHours()}h` as string,
        (a, b) => parseInt(a) - parseInt(b));
    } else if (period === "Semana") {
      revenueData = bucket(cur, (o) => DAY_NAMES[o.createdAt.getDay()]);
    } else {
      revenueData = bucket(cur, (o) => {
        const weeksAgo = Math.floor((now - o.createdAt.getTime()) / (7 * 86400000));
        return weeksAgo === 0 ? "Esta sem." : `Sem. -${weeksAgo}`;
      });
    }

    if (revenueData.length === 0) {
      revenueData = [{ day: "—", revenue: 0, orders: 0 }];
    }

    // ── Hourly distribution ────────────────────────────────────────────────────
    const hourMap: Record<number, number> = {};
    cur.forEach((o) => {
      const h = o.createdAt.getHours();
      hourMap[h] = (hourMap[h] ?? 0) + 1;
    });
    const hourlyData = Object.entries(hourMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([h, orders]) => ({ hour: `${h}h`, orders }));

    // ── Top products ──────────────────────────────────────────────────────────
    const prodMap: Record<string, { qty: number; revenue: number }> = {};
    cur.forEach((o) => {
      o.items.forEach((item) => {
        if (!prodMap[item.name]) prodMap[item.name] = { qty: 0, revenue: 0 };
        prodMap[item.name].qty     += item.quantity;
        prodMap[item.name].revenue += item.quantity * item.price;
      });
    });
    const topProducts = Object.entries(prodMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // ── Channel & payment pies ────────────────────────────────────────────────
    const total = cur.length || 1;

    const CHAN_COLOR: Record<string, string> = { delivery: "#FF5A1F", local: "#6366F1", takeaway: "#22D3EE" };
    const CHAN_LABEL: Record<string, string> = { delivery: "Delivery", local: "Local", takeaway: "Takeaway" };
    const chanMap: Record<string, number> = {};
    cur.forEach((o) => { chanMap[o.type] = (chanMap[o.type] ?? 0) + 1; });
    const channelData = Object.entries(chanMap).map(([t, n]) => ({
      name: CHAN_LABEL[t] ?? t,
      value: Math.round((n / total) * 100),
      color: CHAN_COLOR[t] ?? "#888",
    }));

    const PAY_COLOR: Record<string, string> = { pix: "#10B981", card: "#6366F1", cash: "#F59E0B" };
    const PAY_LABEL: Record<string, string> = { pix: "PIX", card: "Cartão", cash: "Dinheiro" };
    const payMap: Record<string, number> = {};
    cur.forEach((o) => { payMap[o.paymentMethod] = (payMap[o.paymentMethod] ?? 0) + 1; });
    const paymentData = Object.entries(payMap).map(([m, n]) => ({
      name: PAY_LABEL[m] ?? m,
      value: Math.round((n / total) * 100),
      color: PAY_COLOR[m] ?? "#888",
    }));

    return { kpis, revenueData, hourlyData, topProducts, channelData, paymentData };
  }, [orders, period]);
}

// ─── Component ────────────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("Hoje");
  const d = useDerivedAnalytics(period);

  return (
    <div className="flex flex-col h-full bg-neutral-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-2 border-b border-neutral-800 shrink-0">
        <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded-full">
          ● dados em tempo real
        </span>
        <div className="flex gap-2">
          {(["Hoje", "Semana", "Mês"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                period === p
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-6 gap-3">
            {d.kpis.map((kpi) => (
              <div key={kpi.label} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{kpi.icon}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    kpi.delta === "—"
                      ? "text-neutral-500 bg-neutral-700"
                      : kpi.positive
                        ? "text-green-400 bg-green-400/10"
                        : "text-red-400 bg-red-400/10"
                  }`}>
                    {kpi.delta}
                  </span>
                </div>
                <p className="text-lg font-black text-neutral-100">{kpi.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue + Hourly */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">
                {period === "Hoje" ? "Receita por Hora" : period === "Semana" ? "Receita por Dia" : "Receita por Semana"}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={d.revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF5A1F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF5A1F" strokeWidth={2} fill="url(#revenueGrad)" dot={{ fill: "#FF5A1F", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Pedidos por Hora</h3>
              {d.hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.hourlyData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-neutral-600 text-sm">Sem dados</div>
              )}
            </div>
          </div>

          {/* Top products + Pies */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Top Produtos</h3>
              {d.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {d.topProducts.map((p, i) => {
                    const maxQty = d.topProducts[0].qty;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 w-4">{i + 1}</span>
                            <span className="text-xs text-neutral-200 truncate max-w-[130px]">{p.name}</span>
                          </div>
                          <span className="text-xs font-bold text-neutral-400">{p.qty}×</span>
                        </div>
                        <div className="h-1 bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-neutral-600 text-sm">Sem dados</div>
              )}
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Canal de Venda</h3>
              {d.channelData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={d.channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {d.channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {d.channelData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-neutral-400">{item.name}</span>
                        </div>
                        <span className="font-bold text-neutral-300">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-neutral-600 text-sm">Sem dados</div>
              )}
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Forma de Pagamento</h3>
              {d.paymentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={d.paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {d.paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {d.paymentData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-neutral-400">{item.name}</span>
                        </div>
                        <span className="font-bold text-neutral-300">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-neutral-600 text-sm">Sem dados</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
