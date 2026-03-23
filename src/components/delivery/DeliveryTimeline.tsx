import { DeliveryEvent, DeliveryStatus } from "@/store/useDeliveryStore";

const steps: { status: DeliveryStatus; label: string; icon: string }[] = [
  { status: "confirmed",  label: "Pedido Confirmado",   icon: "📋" },
  { status: "preparing",  label: "Em Preparo",           icon: "🍳" },
  { status: "ready",      label: "Pronto para Retirada", icon: "✅" },
  { status: "picked_up",  label: "Coletado pelo Motoboy",icon: "🏍️" },
  { status: "on_the_way", label: "A Caminho",            icon: "🚀" },
  { status: "delivered",  label: "Entregue",             icon: "🎉" },
];

interface Props {
  timeline: DeliveryEvent[];
  currentStatus: DeliveryStatus;
}

export default function DeliveryTimeline({ timeline, currentStatus }: Props) {
  const doneStatuses = new Set(timeline.map((e) => e.status));

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = doneStatuses.has(step.status);
        const current = step.status === currentStatus;
        const event = timeline.find((e) => e.status === step.status);
        const isLast = i === steps.length - 1;

        return (
          <div key={step.status} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                  done
                    ? "bg-green-500/20 border-2 border-green-500"
                    : current
                    ? "bg-brand-primary/20 border-2 border-brand-primary"
                    : "bg-neutral-800 border-2 border-neutral-700"
                }`}
              >
                {done ? "✓" : step.icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[20px] my-1 ${done ? "bg-green-500/40" : "bg-neutral-800"}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className={`text-sm font-medium ${done ? "text-neutral-200" : "text-neutral-600"}`}>
                {step.label}
              </p>
              {event && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {event.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
              {current && !done && (
                <p className="text-xs text-brand-primary mt-0.5 animate-pulse">Em andamento...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
