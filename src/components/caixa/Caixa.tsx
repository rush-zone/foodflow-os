"use client";

import { useState } from "react";
import { useCaixaStore, MovementType } from "@/store/useCaixaStore";
import { useFlowStore } from "@/store/useFlowStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

const OPERATORS = ["Admin", "João", "Maria", "Carlos"];

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

// ─── Abertura ────────────────────────────────────────────────────────────────
function AberturaCaixa() {
  const open         = useCaixaStore((s) => s.open);
  const loggedIn     = useAuthStore((s) => s.operator);
  const [operator, setOperator] = useState(loggedIn ?? OPERATORS[0]);
  const [balance, setBalance]   = useState("0,00");

  function handleOpen() {
    const val = parseFloat(balance.replace(",", ".")) || 0;
    open(operator, val);
    toast.success("Caixa aberto", `Operador: ${operator} · Fundo: R$ ${fmt(val)}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          💰
        </div>
        <h2 className="text-xl font-black text-white">Abrir Caixa</h2>
        <p className="text-sm text-neutral-500 mt-1">Informe o operador e o valor inicial em espécie</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <p className="text-xs text-neutral-500 mb-2 font-medium">Operador</p>
          {loggedIn ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xs font-bold text-orange-400">
                {loggedIn.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{loggedIn}</p>
                <p className="text-xs text-neutral-500">operador logado</p>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-2">
            {OPERATORS.map((op) => (
              <button
                key={op}
                onClick={() => setOperator(op)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  operator === op
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
          )}
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

// ─── Movimento modal ──────────────────────────────────────────────────────────
function MovementModal({ type, onClose }: { type: MovementType; onClose: () => void }) {
  const addMovement = useCaixaStore((s) => s.addMovement);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSave() {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0) return;
    const desc = note.trim() || (type === "suprimento" ? "Suprimento" : "Sangria");
    addMovement(type, val, desc);
    toast.info(isSup ? "Suprimento registrado" : "Sangria registrada", `R$ ${fmt(val)}${note.trim() ? ` — ${note.trim()}` : ""}`);
    onClose();
  }

  const isSup = type === "suprimento";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-80 shadow-card overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700">
          <h3 className="font-bold text-white">{isSup ? "➕ Suprimento" : "➖ Sangria"}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-neutral-500 mb-2">Valor (R$)</p>
            <input
              autoFocus
              type="text"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white text-center font-bold outline-none focus:border-brand-primary/60"
            />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-2">Observação (opcional)</p>
            <input
              type="text"
              placeholder={isSup ? "Ex: Reforço de troco" : "Ex: Retirada gerente"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60"
            />
          </div>
          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
              isSup ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fechamento modal ─────────────────────────────────────────────────────────
function FechamentoModal({ onClose }: { onClose: () => void }) {
  const { openingBalance, movements, openedAt, operator, close } = useCaixaStore();
  const orders = useFlowStore((s) => s.orders);

  // Only orders from this shift
  const shiftOrders = orders.filter((o) =>
    o.status !== "cancelled" && openedAt && o.createdAt >= openedAt
  );

  const byPayment = {
    pix:  shiftOrders.filter((o) => o.paymentMethod === "pix").reduce((s, o) => s + o.total, 0),
    card: shiftOrders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0),
    cash: shiftOrders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0),
  };

  const manualSup   = movements.filter((m) => m.type === "suprimento" && !m.auto).reduce((s, m) => s + m.amount, 0);
  const sanTotal    = movements.filter((m) => m.type === "sangria").reduce((s, m) => s + m.amount, 0);
  const expectedCash = openingBalance + byPayment.cash + manualSup - sanTotal;
  const duration = openedAt
    ? Math.round((Date.now() - openedAt.getTime()) / 60000)
    : 0;

  function handleClose() {
    close();
    onClose();
    toast.warning("Caixa fechado", `Duração: ${duration}min`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-[440px] shadow-card overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h3 className="font-bold text-white">Fechar Caixa — Relatório do Turno</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Operador",    value: operator },
              { label: "Duração",     value: `${duration} min` },
              { label: "Troco inicial", value: `R$ ${fmt(openingBalance)}` },
              { label: "Pedidos",     value: String(shiftOrders.length) },
            ].map((row) => (
              <div key={row.label} className="bg-neutral-700/50 rounded-xl px-4 py-3">
                <p className="text-xs text-neutral-500 mb-1">{row.label}</p>
                <p className="text-sm font-bold text-white">{row.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Vendas por forma de pagamento</p>
            <div className="space-y-2">
              {[
                { label: "⚡ PIX",      value: byPayment.pix,  color: "text-blue-400" },
                { label: "💳 Cartão",   value: byPayment.card, color: "text-purple-400" },
                { label: "💵 Dinheiro", value: byPayment.cash, color: "text-green-400" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center px-4 py-2.5 bg-neutral-700/40 rounded-xl">
                  <span className="text-sm text-neutral-300">{row.label}</span>
                  <span className={`font-bold text-sm ${row.color}`}>R$ {fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-2.5 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="font-black text-brand-primary">R$ {fmt(byPayment.pix + byPayment.card + byPayment.cash)}</span>
              </div>
            </div>
          </div>

          {movements.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 mb-2 font-medium">Movimentações</p>
              <div className="space-y-1.5">
                {movements.map((m) => (
                  <div key={m.id} className={`flex justify-between items-center px-4 py-2 rounded-lg ${m.auto ? "bg-green-500/5 border border-green-500/10" : "bg-neutral-700/40"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{m.auto ? "💵" : m.type === "suprimento" ? "➕" : "➖"}</span>
                      <div>
                        <span className={`text-xs font-bold ${m.type === "suprimento" ? "text-green-400" : "text-red-400"}`}>
                          {m.type === "suprimento" ? "+" : "−"} R$ {fmt(m.amount)}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">{m.note}</span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-600">
                      {m.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <span className="text-sm font-bold text-white">Caixa esperado (dinheiro)</span>
            <span className="font-black text-green-400 text-lg">R$ {fmt(expectedCash)}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Fechar Caixa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard do caixa aberto ────────────────────────────────────────────────
function CaixaAberta() {
  const { operator, openedAt, openingBalance, movements } = useCaixaStore();
  const orders = useFlowStore((s) => s.orders);
  const [modal, setModal] = useState<MovementType | null>(null);
  const [showFechamento, setShowFechamento] = useState(false);

  // Only count orders from this shift
  const shiftOrders = orders.filter((o) =>
    !["cancelled"].includes(o.status) && openedAt && o.createdAt >= openedAt
  );
  const byPayment = {
    pix:  shiftOrders.filter((o) => o.paymentMethod === "pix").reduce((s, o) => s + o.total, 0),
    card: shiftOrders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0),
    cash: shiftOrders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0),
  };
  const totalRevenue = byPayment.pix + byPayment.card + byPayment.cash;
  const supTotal  = movements.filter((m) => m.type === "suprimento").reduce((s, m) => s + m.amount, 0);
  const sanTotal  = movements.filter((m) => m.type === "sangria").reduce((s, m) => s + m.amount, 0);
  // cashInBox: cash sales are auto-registered as suprimentos — avoid double counting
  const manualSup = movements.filter((m) => m.type === "suprimento" && !m.auto).reduce((s, m) => s + m.amount, 0);
  const cashInBox = openingBalance + byPayment.cash + manualSup - sanTotal;

  const duration = openedAt
    ? Math.round((Date.now() - openedAt.getTime()) / 60000)
    : 0;

  return (
    <>
      {modal && <MovementModal type={modal} onClose={() => setModal(null)} />}
      {showFechamento && <FechamentoModal onClose={() => setShowFechamento(false)} />}

      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Status bar */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white">Caixa aberto</span>
            <span className="text-xs text-neutral-500">
              {openedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {operator} · {duration} min
            </span>
          </div>
          <button
            onClick={() => setShowFechamento(true)}
            className="px-4 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-xs font-bold rounded-lg transition-colors"
          >
            Fechar Caixa
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Receita Total",    value: `R$ ${fmt(totalRevenue)}`,   color: "text-brand-primary" },
              { label: "Dinheiro em Caixa", value: `R$ ${fmt(cashInBox)}`,     color: "text-green-400" },
              { label: "Pedidos",           value: String(shiftOrders.length), color: "text-blue-400" },
              { label: "Ticket Médio",      value: shiftOrders.length > 0 ? `R$ ${fmt(totalRevenue / shiftOrders.length)}` : "—", color: "text-yellow-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-neutral-800 border border-neutral-700 rounded-2xl px-5 py-4">
                <p className="text-xs text-neutral-500 mb-1">{kpi.label}</p>
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Pagamentos */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Vendas por pagamento</h3>
              <div className="space-y-3">
                {[
                  { label: "⚡ PIX",      value: byPayment.pix,  color: "bg-blue-500",   pct: totalRevenue > 0 ? byPayment.pix / totalRevenue : 0 },
                  { label: "💳 Cartão",   value: byPayment.card, color: "bg-purple-500", pct: totalRevenue > 0 ? byPayment.card / totalRevenue : 0 },
                  { label: "💵 Dinheiro", value: byPayment.cash, color: "bg-green-500",  pct: totalRevenue > 0 ? byPayment.cash / totalRevenue : 0 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">{row.label}</span>
                      <span className="font-bold text-white">R$ {fmt(row.value)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${row.color} rounded-full transition-all`}
                        style={{ width: `${(row.pct * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Movimentações */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Movimentações</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal("suprimento")}
                    className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-bold rounded-lg transition-colors"
                  >
                    + Suprimento
                  </button>
                  <button
                    onClick={() => setModal("sangria")}
                    className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-xs font-bold rounded-lg transition-colors"
                  >
                    − Sangria
                  </button>
                </div>
              </div>

              {movements.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-6">Nenhuma movimentação</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-neutral-700/50 rounded-lg">
                      <div>
                        <span className={`text-xs font-bold ${m.type === "suprimento" ? "text-blue-400" : "text-red-400"}`}>
                          {m.type === "suprimento" ? "+" : "−"} R$ {fmt(m.amount)}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">{m.note}</span>
                      </div>
                      <span className="text-xs text-neutral-600">
                        {m.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-neutral-700 flex justify-between text-xs">
                <span className="text-neutral-500">Saldo movimentações</span>
                <span className={`font-bold ${supTotal - sanTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {supTotal - sanTotal >= 0 ? "+" : ""}R$ {fmt(supTotal - sanTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Caixa() {
  const isOpen = useCaixaStore((s) => s.isOpen);
  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {isOpen ? <CaixaAberta /> : <AberturaCaixa />}
    </div>
  );
}
