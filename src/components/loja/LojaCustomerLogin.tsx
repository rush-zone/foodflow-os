"use client";

import { useEffect, useMemo } from "react";
import { useFlowStore, FlowOrder } from "@/store/useFlowStore";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";
import DeliveryStatusBadge from "@/components/delivery/DeliveryStatusBadge";

interface Props {
  onBack:  () => void;
  onFound: (orderId: string) => void;
}

export default function LojaCustomerLogin({ onBack, onFound }: Props) {
  const session        = useLojaCustomerStore((s) => s.session);
  const setActiveOrder = useLojaCustomerStore((s) => s.setActiveOrder);
  const orders         = useFlowStore((s) => s.orders);

  // Find all orders matching the logged-in customer's phone
  const myOrders = useMemo(() => {
    if (!session?.phone) return [];
    const digits = session.phone.replace(/\D/g, "");
    return orders
      .filter((o) => o.phone && o.phone.replace(/\D/g, "").includes(digits))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, session?.phone]);

  // If there's exactly one active order, jump straight to tracking
  useEffect(() => {
    const active = myOrders.find(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    );
    if (active) {
      setActiveOrder(active.id);
      onFound(active.id);
    }
  }, [myOrders, setActiveOrder, onFound]);

  function handleSelect(order: FlowOrder) {
    setActiveOrder(order.id);
    onFound(order.id);
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200 shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-neutral-500 hover:text-neutral-800 transition-colors">←</button>
        <h1 className="text-lg font-black text-neutral-900">Meus pedidos</h1>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-4">

        {myOrders.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold text-neutral-900">Nenhum pedido encontrado</p>
            <p className="text-sm mt-1 text-neutral-500">Você ainda não fez nenhum pedido.</p>
            <button
              onClick={onBack}
              className="mt-6 px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl transition-colors text-sm shadow"
            >
              Ver cardápio
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {myOrders.length} pedido{myOrders.length > 1 ? "s" : ""}
            </p>
            {myOrders.map((order) => {
              const isActive = order.status !== "delivered" && order.status !== "cancelled";
              return (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className={`w-full text-left rounded-2xl p-4 transition-all space-y-2 border shadow-sm ${
                    isActive
                      ? "bg-brand-primary/5 border-brand-primary/30 hover:border-brand-primary/60"
                      : "bg-white border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-900 font-bold text-sm">Pedido #{order.number}</span>
                    <DeliveryStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                    <p className="text-xs font-bold text-brand-primary">
                      R$ {order.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400 truncate">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                  {isActive && (
                    <p className="text-xs text-brand-primary font-semibold">
                      Acompanhar →
                    </p>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
