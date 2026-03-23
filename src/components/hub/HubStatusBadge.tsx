import { FlowStatus } from "@/store/useFlowStore";

const config: Partial<Record<FlowStatus, { label: string; color: string }>> = {
  pending:    { label: "Aguardando", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  preparing:  { label: "Em Preparo", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  ready:      { label: "Pronto",     color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  picked_up:  { label: "Coletado",   color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  on_the_way: { label: "A Caminho",  color: "text-brand-primary bg-brand-primary/10 border-brand-primary/30" },
  delivered:  { label: "Entregue",   color: "text-green-400 bg-green-400/10 border-green-400/30" },
  cancelled:  { label: "Cancelado",  color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

export default function HubStatusBadge({ status }: { status: FlowStatus }) {
  const cfg = config[status];
  if (!cfg) return null;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
