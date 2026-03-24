"use client";

import { useConfigStore, planIncludes } from "@/store/useConfigStore";
import LojaStorefront from "./LojaStorefront";

export default function LojaGate() {
  const plan = useConfigStore((s) => s.plan);
  const config = useConfigStore((s) => s.config);
  const hasAccess = planIncludes(plan, "growth");

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8 text-center gap-6">
        <span className="text-6xl">🔒</span>
        <div>
          <p className="text-white font-black text-xl">FlowStore não disponível</p>
          <p className="text-neutral-500 text-sm mt-2 max-w-xs">
            O app próprio de vendas requer o plano <span className="text-brand-primary font-bold">Growth</span> ou superior.
          </p>
        </div>
      </div>
    );
  }

  return <LojaStorefront />;
}
