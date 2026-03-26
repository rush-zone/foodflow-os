"use client";

import { useState } from "react";
import { useCaixaStore } from "@/store/useCaixaStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import CatalogPanel from "./CatalogPanel";
import OrderPanel from "./OrderPanel";
import PaymentPanel from "./PaymentPanel";

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

// Somente role "caixa" pode abrir — outros veem aviso
function CaixaFechada() {
  const open     = useCaixaStore((s) => s.open);
  const addAudit = useCaixaStore((s) => s.addAuditEntry);
  const loggedIn = useAuthStore((s) => s.operator);
  const [balance, setBalance] = useState("0,00");

  const isCaixaOp = loggedIn?.role === "caixa";

  function handleOpen() {
    if (!isCaixaOp || !loggedIn) return;
    const val = parseFloat(balance.replace(",", ".")) || 0;
    open(loggedIn.name, val);
    addAudit({ action: "open", performedBy: loggedIn.name, role: loggedIn.role, note: `Fundo: R$ ${fmt(val)}` });
    toast.success("Caixa aberto", `Operador: ${loggedIn.name} · Fundo: R$ ${fmt(val)}`);
  }

  // Admin / gerente / outros — caixa ainda não foi aberto
  if (!isCaixaOp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-neutral-900">
        <div className="w-16 h-16 bg-neutral-800 border border-neutral-700 rounded-2xl flex items-center justify-center text-3xl mx-auto">
          🔒
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white">Caixa Fechado</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Aguardando o Operador de Caixa abrir o turno
          </p>
        </div>
        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-400 text-center">
            Somente o <strong>Operador de Caixa</strong> pode abrir o caixa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 bg-neutral-900">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          💰
        </div>
        <h2 className="text-xl font-black text-white">Caixa Fechado</h2>
        <p className="text-sm text-neutral-500 mt-1">Informe o valor inicial em espécie</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <p className="text-xs text-neutral-500 mb-2 font-medium">Operador</p>
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-xs font-bold text-brand-primary">
              {loggedIn.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{loggedIn.name}</p>
              <p className="text-xs text-neutral-500">operador de caixa</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-2 font-medium">Troco inicial (R$)</p>
          <input
            type="text"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-lg font-bold text-white text-center outline-none focus:border-brand-primary/60 transition-colors"
          />
        </div>

        <button
          onClick={handleOpen}
          className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          Abrir Caixa ✓
        </button>
      </div>
    </div>
  );
}

export default function PDV() {
  const isOpen = useCaixaStore((s) => s.isOpen);

  if (!isOpen) return <CaixaFechada />;


  return (
    <div className="flex flex-col h-full bg-neutral-900">
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Catalog */}
        <div className="w-[55%] border-r border-neutral-800 flex flex-col overflow-hidden">
          <CatalogPanel />
        </div>

        {/* CENTER — Order */}
        <div className="w-[25%] border-r border-neutral-800 flex flex-col overflow-hidden">
          <OrderPanel />
        </div>

        {/* RIGHT — Payment */}
        <div className="w-[20%] flex flex-col overflow-hidden">
          <PaymentPanel />
        </div>
      </div>
    </div>
  );
}
