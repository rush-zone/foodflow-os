"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// --- Mock data ---
const revenueData = [
  { day: "Seg", revenue: 1240, orders: 18 },
  { day: "Ter", revenue: 980,  orders: 14 },
  { day: "Qua", revenue: 1560, orders: 22 },
  { day: "Qui", revenue: 1890, orders: 27 },
  { day: "Sex", revenue: 2340, orders: 34 },
  { day: "Sáb", revenue: 3100, orders: 45 },
  { day: "Dom", revenue: 2750, orders: 39 },
];

const hourlyData = [
  { hour: "11h", orders: 3 },
  { hour: "12h", orders: 12 },
  { hour: "13h", orders: 18 },
  { hour: "14h", orders: 9 },
  { hour: "15h", orders: 5 },
  { hour: "16h", orders: 4 },
  { hour: "17h", orders: 6 },
  { hour: "18h", orders: 14 },
  { hour: "19h", orders: 22 },
  { hour: "20h", orders: 28 },
  { hour: "21h", orders: 24 },
  { hour: "22h", orders: 15 },
];

const topProducts = [
  { name: "Double Smash",        qty: 87, revenue: 3471.3 },
  { name: "Pizza Pepperoni",     qty: 64, revenue: 3328.0 },
  { name: "Smash Burger Clássico", qty: 103, revenue: 2976.7 },
  { name: "Chicken Crispy",      qty: 59, revenue: 1587.1 },
  { name: "Batata Frita G",      qty: 78, revenue: 1942.2 },
  { name: "Milkshake",           qty: 52, revenue: 878.8 },
];

const channelData = [
  { name: "Delivery", value: 52, color: "#FF5A1F" },
  { name: "Local",    value: 33, color: "#6366F1" },
  { name: "Takeaway", value: 15, color: "#22D3EE" },
];

const paymentData = [
  { name: "PIX",     value: 48, color: "#10B981" },
  { name: "Cartão",  value: 38, color: "#6366F1" },
  { name: "Dinheiro",value: 14, color: "#F59E0B" },
];

const kpis = [
  { label: "Receita Semanal",  value: "R$ 13.860", delta: "+18%",  positive: true,  icon: "💰" },
  { label: "Pedidos Semana",   value: "199",        delta: "+12%",  positive: true,  icon: "📋" },
  { label: "Ticket Médio",     value: "R$ 69,65",   delta: "+5%",   positive: true,  icon: "🎯" },
  { label: "Tempo Médio KDS",  value: "14min",      delta: "-2min", positive: true,  icon: "⏱️" },
  { label: "Taxa Cancelamento",value: "3,2%",       delta: "+0,5%", positive: false, icon: "❌" },
  { label: "Avaliação Média",  value: "4,8 ⭐",     delta: "+0,1",  positive: true,  icon: "⭐" },
];

const tooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

export default function Analytics() {
  return (
    <div className="flex flex-col h-screen bg-neutral-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">FF</div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
              📊 BI & Analytics
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {["Hoje", "Semana", "Mês"].map((p) => (
            <button
              key={p}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                p === "Semana"
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
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{kpi.icon}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    kpi.positive
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
            {/* Revenue area chart */}
            <div className="col-span-2 bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Receita por Dia</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.3} />
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

            {/* Hourly bar chart */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Pedidos por Hora</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top products + Pie charts */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top products */}
            <div className="col-span-1 bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Top Produtos</h3>
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const maxQty = topProducts[0].qty;
                  const pct = (p.qty / maxQty) * 100;
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
                        <div
                          className="h-full bg-brand-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel pie */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Canal de Venda</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {channelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {channelData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-neutral-400">{d.name}</span>
                    </div>
                    <span className="font-bold text-neutral-300">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment pie */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 mb-4">Forma de Pagamento</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {paymentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {paymentData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-neutral-400">{d.name}</span>
                    </div>
                    <span className="font-bold text-neutral-300">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
