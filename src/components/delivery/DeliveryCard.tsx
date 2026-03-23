"use client";

import { DeliveryOrder } from "@/store/useDeliveryStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import KDSTimer from "@/components/kds/KDSTimer";

export default function DeliveryCard({ order }: { order: DeliveryOrder }) {
  const select = useDeliveryStore((s) => s.select);
  const selectedId = useDeliveryStore((s) => s.selectedId);
  const isSelected = selectedId === order.id;

  return (
    <button
      onClick={() => select(order.id)}
      className={`w-full text-left px-4 py-3.5 border-b border-neutral-800 transition-colors ${
        isSelected ? "bg-brand-primary/5 border-l-2 border-l-brand-primary" : "hover:bg-neutral-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-sm font-bold text-neutral-100">#{order.number}</span>
          <span className="text-sm text-neutral-400 ml-2">{order.customer}</span>
        </div>
        <DeliveryStatusBadge status={order.status} />
      </div>

      <div className="text-xs text-neutral-500 truncate mb-2">{order.address}</div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-neutral-500">
          <span>📍 {order.distance}</span>
          <span>🕐 ~{order.estimatedMinutes}min</span>
        </div>
        {order.status !== "delivered" && order.status !== "failed" && (
          <KDSTimer since={order.createdAt} urgent={50} warning={35} />
        )}
      </div>

      {order.motoboy && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-4 h-4 rounded-full bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-bold">
            {order.motoboy.avatar[0]}
          </span>
          {order.motoboy.name}
        </div>
      )}
    </button>
  );
}
