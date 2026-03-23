import { DeliveryStatus } from "@/store/useDeliveryStore";

const config: Record<DeliveryStatus, { label: string; color: string; dot: string }> = {
  confirmed:   { label: "Confirmado",    color: "text-blue-400 bg-blue-400/10 border-blue-400/30",     dot: "bg-blue-400" },
  preparing:   { label: "Em Preparo",    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", dot: "bg-yellow-400" },
  ready:       { label: "Pronto",        color: "text-purple-400 bg-purple-400/10 border-purple-400/30", dot: "bg-purple-400" },
  picked_up:   { label: "Coletado",      color: "text-orange-400 bg-orange-400/10 border-orange-400/30", dot: "bg-orange-400" },
  on_the_way:  { label: "A Caminho",     color: "text-brand-primary bg-brand-primary/10 border-brand-primary/30", dot: "bg-brand-primary" },
  delivered:   { label: "Entregue",      color: "text-green-400 bg-green-400/10 border-green-400/30",   dot: "bg-green-400" },
  failed:      { label: "Falha",         color: "text-red-400 bg-red-400/10 border-red-400/30",         dot: "bg-red-400" },
};

export default function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { label, color, dot } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      {label}
    </span>
  );
}
