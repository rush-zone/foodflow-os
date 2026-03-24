"use client";

import { useEffect, useRef, useState } from "react";
import { useFlowStore, FlowStatus } from "@/store/useFlowStore";
import KDSOrderCard from "./KDSOrderCard";

function playAlert() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, dur: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880, 0,    0.12);
    play(1100, 0.16, 0.12);
    play(880, 0.32, 0.18);
  } catch { /* browser blocked autoplay — silent fail */ }
}

const columns: { status: FlowStatus; label: string; icon: string; color: string }[] = [
  { status: "pending",   label: "Novos",      icon: "🔔", color: "text-blue-400" },
  { status: "preparing", label: "Em Preparo", icon: "🔥", color: "text-yellow-400" },
  { status: "ready",     label: "Prontos",    icon: "✅", color: "text-green-400" },
];

export default function KDS() {
  const orders = useFlowStore((s) => s.orders);
  const [clock, setClock] = useState("");
  const prevPendingIds = useRef<Set<string>>(
    new Set(orders.filter((o) => o.status === "pending").map((o) => o.id))
  );

  // Clock
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Pede permissão de notificação ao montar
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Som + notificação browser quando novo pedido chega
  useEffect(() => {
    const pending = orders.filter((o) => o.status === "pending");
    const currentIds = new Set(pending.map((o) => o.id));
    const newOrders  = pending.filter((o) => !prevPendingIds.current.has(o.id));

    if (newOrders.length > 0) {
      playAlert();

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        newOrders.forEach((o) => {
          const typeLabel = o.type === "delivery" ? "🏍️ Delivery" : o.type === "takeaway" ? "🥡 Retirada" : "🪑 Mesa";
          new Notification(`🔔 Novo pedido #${o.number}`, {
            body: `${typeLabel} — ${o.customer}  ·  R$ ${o.total.toFixed(2).replace(".", ",")}`,
            icon: "/favicon.ico",
            tag:  `order-${o.id}`, // agrupa notificações do mesmo pedido
          });
        });
      }
    }

    prevPendingIds.current = currentIds;
  }, [orders]);

  // KDS shows orders that are in kitchen phase
  const kdsOrders = orders.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status)
  );

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      <header className="flex items-center justify-between px-6 py-2 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex gap-4 text-sm">
          {columns.map((col) => {
            const count = kdsOrders.filter((o) => o.status === col.status).length;
            return (
              <span key={col.status} className={`${col.color} font-medium`}>
                {col.icon} {count} {col.label}
              </span>
            );
          })}
        </div>
        <span className="font-mono text-neutral-400 text-sm tabular-nums">{clock}</span>
      </header>

      <div className="flex flex-1 overflow-hidden gap-0 divide-x divide-neutral-800">
        {columns.map((col) => {
          const colOrders = kdsOrders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
                <h2 className={`text-sm font-bold ${col.color}`}>
                  {col.icon} {col.label}
                  <span className="ml-2 text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-normal">
                    {colOrders.length}
                  </span>
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-700 text-center">
                    <span className="text-3xl mb-2">
                      {col.status === "pending" ? "😴" : col.status === "preparing" ? "⏳" : "🎉"}
                    </span>
                    <p className="text-xs">
                      {col.status === "pending" ? "Nenhum pedido novo" : col.status === "preparing" ? "Nada em preparo" : "Tudo entregue!"}
                    </p>
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <KDSOrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
