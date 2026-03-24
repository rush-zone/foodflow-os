"use client";

import { useEffect, useRef } from "react";
import { useFlowStore } from "@/store/useFlowStore";
import { useMotoboysAuthStore } from "@/store/useMotoboysAuthStore";
import MotoboyOrderCard from "./MotoboyOrderCard";

export default function MotoboyPortal() {
  const motoboy    = useMotoboysAuthStore((s) => s.currentMotoboy)!;
  const logout     = useMotoboysAuthStore((s) => s.logout);
  const orders     = useFlowStore((s) => s.orders);
  const available  = useFlowStore((s) => s.availableMotoboys);

  const isAvailable = available.has(motoboy.id);

  // Pedidos que estou entregando
  const myOrders = orders.filter(
    (o) =>
      o.type === "delivery" &&
      o.motoboy?.id === motoboy.id &&
      (o.status === "ready" || o.status === "picked_up" || o.status === "on_the_way")
  );

  // Pedidos prontos sem motoboy (só exibe se estou disponível)
  const unassigned = orders.filter(
    (o) => o.type === "delivery" && o.status === "ready" && !o.motoboy
  );

  // Minhas entregas concluídas hoje
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completed = orders.filter(
    (o) =>
      o.type === "delivery" &&
      o.motoboy?.id === motoboy.id &&
      o.status === "delivered" &&
      o.closedAt &&
      o.closedAt >= todayStart
  );

  const totalEarned = completed.reduce((sum, o) => sum + o.total, 0);

  // Notificações browser para pedidos prontos sem motoboy
  const seenRef = useRef(new Set<string>());
  useEffect(() => {
    const readyFree = orders.filter((o) => o.type === "delivery" && o.status === "ready" && !o.motoboy);
    readyFree.forEach((o) => {
      if (!seenRef.current.has(o.id) && typeof Notification !== "undefined" && Notification.permission === "granted") {
        seenRef.current.add(o.id);
        new Notification("Novo pedido disponível! 🏍️", {
          body: `#${o.number} — ${o.customer} · ${o.neighborhood ?? o.address}`,
          icon: "/favicon.ico",
        });
      }
    });
  }, [orders]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 font-black text-base flex items-center justify-center">
            {motoboy.avatar}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{motoboy.name}</p>
            <p className="text-xs text-neutral-500">{motoboy.vehicle} · {motoboy.plate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isAvailable
              ? "bg-green-500/15 text-green-400"
              : "bg-orange-500/15 text-orange-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isAvailable ? "bg-green-400" : "bg-orange-400"
            }`} />
            {isAvailable ? "Disponível" : "Em entrega"}
          </div>
          <button
            onClick={logout}
            className="text-xs text-neutral-600 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {completed.length > 0 && (
        <div className="bg-neutral-900/50 border-b border-neutral-800 px-4 py-2.5 flex gap-6">
          <div className="text-center">
            <p className="text-xs text-neutral-500">Entregas hoje</p>
            <p className="text-sm font-black text-white">{completed.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500">Volume hoje</p>
            <p className="text-sm font-black text-green-400">
              R$ {totalEarned.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-lg mx-auto w-full">

        {/* Minhas entregas ativas */}
        {myOrders.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              🏍️ Em andamento
              <span className="bg-orange-500/20 text-orange-300 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {myOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {myOrders.map((o) => (
                <MotoboyOrderCard key={o.id} order={o} motoboyId={motoboy.id} variant="active" />
              ))}
            </div>
          </section>
        )}

        {/* Prontos para coletar */}
        {unassigned.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              📦 Aguardando coleta
              <span className="bg-blue-500/20 text-blue-300 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {unassigned.length}
              </span>
            </h2>
            <div className="space-y-3">
              {unassigned.map((o) => (
                <MotoboyOrderCard key={o.id} order={o} motoboyId={motoboy.id} variant="available" />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {myOrders.length === 0 && unassigned.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">✅</span>
            <p className="text-neutral-400 font-medium">Nenhuma entrega pendente</p>
            <p className="text-xs text-neutral-600 mt-1">
              Pedidos prontos aparecerão aqui automaticamente
            </p>
          </div>
        )}

        {/* Concluídas hoje */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
              ✓ Concluídas hoje ({completed.length})
            </h2>
            <div className="space-y-2">
              {completed.map((o) => (
                <div
                  key={o.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-300">
                      #{o.number} — {o.customer}
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">{o.address}</p>
                  </div>
                  <span className="text-sm font-bold text-green-400 shrink-0 ml-3">
                    R$ {o.total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
