"use client";

import { useConfigStore, planIncludes } from "@/store/useConfigStore";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";
import LojaStorefront from "./LojaStorefront";
import LojaAuthScreen from "./LojaAuthScreen";

export default function LojaGate() {
  const plan      = useConfigStore((s) => s.plan);
  const hasAccess = planIncludes(plan, "growth");
  const session   = useLojaCustomerStore((s) => s.session);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8 text-center gap-6">
        <span className="text-6xl">🔒</span>
        <div>
          <p className="text-neutral-900 font-black text-xl">FlowStore não disponível</p>
          <p className="text-neutral-500 text-sm mt-2 max-w-xs">
            O app próprio de vendas requer o plano{" "}
            <span className="text-brand-primary font-bold">Growth</span> ou superior.
          </p>
        </div>
      </div>
    );
  }

  if (!session) return <LojaAuthScreen />;

  return <LojaStorefront />;
}
