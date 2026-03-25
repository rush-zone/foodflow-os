"use client";

import { FlowOrder } from "@/store/useFlowStore";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import KDSTimer from "@/components/kds/KDSTimer";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { HelmetIcon } from "@/components/shared/HelmetIcon";

interface Props {
  order: FlowOrder;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function DeliveryCard({ order, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(order.id)}
      className={`w-full text-left px-4 py-3.5 border-b border-neutral-800 transition-colors ${
        selected ? "bg-brand-primary/5 border-l-2 border-l-brand-primary" : "hover:bg-neutral-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-neutral-100">#{order.number}</span>
          <span className="text-sm text-neutral-400">{order.customer}</span>
          <PlatformBadge platform={order.platform} />
        </div>
        <DeliveryStatusBadge status={order.status} />
      </div>

      {order.address && (
        <div className="text-xs text-neutral-500 truncate mb-1.5">📍 {order.address}</div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500">
          {order.items.length} {order.items.length === 1 ? "item" : "itens"} · R$ {order.total.toFixed(2).replace(".", ",")}
        </span>
        {!["delivered", "cancelled"].includes(order.status) && (
          <KDSTimer since={order.createdAt} urgent={50} warning={35} />
        )}
      </div>

      {order.motoboy && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <HelmetIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span className="text-neutral-300 font-medium">{order.motoboy.name}</span>
          <span className="text-neutral-600">·</span>
          <span className={`font-semibold ${order.motoboy.source === "proprio" ? "text-brand-primary" : "text-neutral-400"}`}>
            {order.motoboy.source === "proprio" ? "Da loja" : "Do app"}
          </span>
        </div>
      )}
    </button>
  );
}
