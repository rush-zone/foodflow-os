"use client";

import { usePlanFeature } from "@/hooks/usePlanFeature";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, useConfigStore } from "@/store/useConfigStore";

interface Props {
  feature: string;
  children: React.ReactNode;
}

export default function PlanGate({ feature, children }: Props) {
  const hasAccess = usePlanFeature(feature);
  const currentPlan = useConfigStore((s) => s.plan);
  const setPlan = useConfigStore((s) => s.setPlan);

  if (hasAccess) return <>{children}</>;

  const required = PLAN_FEATURES[feature];
  const requiredLabel = required ? PLAN_LABELS[required] : "superior";
  const requiredPrice = required ? PLAN_PRICES[required] : "";

  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 gap-6 px-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
        <span className="text-4xl">🔒</span>
      </div>

      <div>
        <p className="text-white font-black text-xl mb-2">
          Recurso exclusivo do plano {requiredLabel}
        </p>
        <p className="text-neutral-500 text-sm max-w-sm">
          Você está no plano <span className="text-brand-primary font-semibold">{PLAN_LABELS[currentPlan]}</span>.
          Faça upgrade para desbloquear este módulo e muito mais.
        </p>
      </div>

      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 w-full max-w-xs">
        <p className="text-xs text-neutral-500 mb-1">Plano necessário</p>
        <p className="text-lg font-black text-white">{requiredLabel}</p>
        <p className="text-brand-primary font-bold text-sm">{requiredPrice}</p>
      </div>

      {/* Demo: troca de plano para testar */}
      <div className="mt-2">
        <p className="text-xs text-neutral-600 mb-2">Demo — simular plano:</p>
        <div className="flex gap-2">
          {(["starter", "pro", "growth", "enterprise"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPlan === p
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700 border border-neutral-700"
              }`}
            >
              {PLAN_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
