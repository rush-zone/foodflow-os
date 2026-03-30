"use client";

import { useState, useEffect, useCallback } from "react";

type Screen =
  | "idle"
  | "insert_card"   // mostrar valor + aguardar aproximação
  | "card_type"     // Débito ou Crédito
  | "installments"  // parcelas (só crédito)
  | "pin"           // digitar senha
  | "processing"    // processando...
  | "approved"
  | "declined";

interface PendingTx { id: string; amount: number; description: string; }

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 10, 12];

export default function TerminalPage() {
  const [screen, setScreen]         = useState<Screen>("idle");
  const [tx, setTx]                 = useState<PendingTx | null>(null);
  const [cardType, setCardType]     = useState<"debit" | "credit" | null>(null);
  const [installments, setInstallments] = useState(1);
  const [pin, setPin]               = useState("");
  const [dots, setDots]             = useState(".");

  // Animated dots for idle/processing
  useEffect(() => {
    const id = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(id);
  }, []);

  // Poll for pending transactions
  useEffect(() => {
    if (screen === "approved" || screen === "declined") return;
    if (screen !== "idle") return; // only poll when idle

    const id = setInterval(async () => {
      try {
        const res  = await fetch("/api/terminal");
        const data = await res.json();
        if (data.pending) {
          setTx(data.pending);
          setPin("");
          setCardType(null);
          setInstallments(1);
          setScreen("insert_card");
        }
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  const sendResult = useCallback(async (status: "approved" | "declined") => {
    if (!tx) return;
    await fetch("/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: status === "approved" ? "approve" : "decline", id: tx.id }),
    });
  }, [tx]);

  function handlePinDigit(d: string) {
    if (pin.length >= 6) return;
    setPin((p) => p + d);
  }

  function handlePinDelete() {
    setPin((p) => p.slice(0, -1));
  }

  async function handlePinConfirm() {
    if (pin.length < 4) return;
    setScreen("processing");
    // Simulate processing time (1.5s)
    await new Promise((r) => setTimeout(r, 1500));
    await sendResult("approved");
    setScreen("approved");
    setTimeout(() => { setScreen("idle"); setTx(null); }, 4000);
  }

  async function handleDecline() {
    setScreen("processing");
    await new Promise((r) => setTimeout(r, 800));
    await sendResult("declined");
    setScreen("declined");
    setTimeout(() => { setScreen("idle"); setTx(null); }, 2500);
  }

  function fmtAmt(v: number) {
    return `R$ ${v.toFixed(2).replace(".", ",")}`;
  }

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (screen === "approved") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 select-none">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <div className="text-center">
          <p className="text-green-400 font-black text-2xl tracking-widest">APROVADO</p>
          <p className="text-white font-black text-3xl mt-2">{fmtAmt(tx?.amount ?? 0)}</p>
          {cardType && (
            <p className="text-neutral-500 text-sm mt-2">
              {cardType === "debit" ? "DÉBITO" : `CRÉDITO ${installments}×`}
            </p>
          )}
        </div>
        <p className="text-neutral-600 text-xs tracking-widest">RETIRE O CARTÃO</p>
      </div>
    );
  }

  // ── DECLINED ──────────────────────────────────────────────────────────────
  if (screen === "declined") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 select-none">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
          <span className="text-4xl">✕</span>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-2xl tracking-widest">RECUSADO</p>
          <p className="text-neutral-500 text-sm mt-1">Transação não autorizada</p>
        </div>
      </div>
    );
  }

  // ── PROCESSING ────────────────────────────────────────────────────────────
  if (screen === "processing") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 select-none">
        <div className="flex gap-2">
          {[0,1,2,3].map((i) => (
            <div key={i} className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
        <p className="text-green-400 font-bold text-lg tracking-widest">PROCESSANDO{dots}</p>
        <p className="text-neutral-600 text-xs">Aguarde</p>
      </div>
    );
  }

  // ── PIN ───────────────────────────────────────────────────────────────────
  if (screen === "pin") {
    const perInstallment = cardType === "credit" && installments > 1
      ? (tx!.amount / installments)
      : null;

    return (
      <div className="min-h-screen bg-black flex flex-col select-none">
        {/* Header */}
        <div className="bg-neutral-900 px-5 py-3 border-b border-neutral-800">
          <p className="text-green-400 text-xs font-bold tracking-widest">SENHA</p>
          <p className="text-white font-black text-xl">{fmtAmt(tx!.amount)}</p>
          {perInstallment && (
            <p className="text-neutral-500 text-xs">{installments}× de {fmtAmt(perInstallment)}</p>
          )}
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-4 py-6">
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? "bg-white border-white" : "border-neutral-600"}`} />
          ))}
        </div>

        {/* Numpad */}
        <div className="flex-1 flex flex-col justify-center px-8 gap-3">
          {[["1","2","3"],["4","5","6"],["7","8","9"],["⌫","0","✓"]].map((row, ri) => (
            <div key={ri} className="grid grid-cols-3 gap-3">
              {row.map((key) => (
                <button
                  key={key}
                  onPointerDown={() => {
                    if (key === "⌫") handlePinDelete();
                    else if (key === "✓") handlePinConfirm();
                    else handlePinDigit(key);
                  }}
                  className={`py-5 rounded-2xl font-black text-xl active:scale-95 transition-transform select-none ${
                    key === "✓"
                      ? "bg-green-600 text-white"
                      : key === "⌫"
                      ? "bg-neutral-800 text-neutral-300"
                      : "bg-neutral-800 text-white"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          onPointerDown={handleDecline}
          className="mx-8 mb-8 py-3 rounded-2xl border border-red-500/40 text-red-400 text-sm font-bold"
        >
          CANCELAR
        </button>
      </div>
    );
  }

  // ── INSTALLMENTS ──────────────────────────────────────────────────────────
  if (screen === "installments") {
    return (
      <div className="min-h-screen bg-black flex flex-col select-none">
        <div className="bg-neutral-900 px-5 py-4 border-b border-neutral-800">
          <p className="text-green-400 text-xs font-bold tracking-widest">CRÉDITO — PARCELAS</p>
          <p className="text-white font-black text-2xl">{fmtAmt(tx!.amount)}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {INSTALLMENT_OPTIONS.map((n) => {
            const perPart = tx!.amount / n;
            return (
              <button
                key={n}
                onPointerDown={() => { setInstallments(n); setScreen("pin"); }}
                className="w-full py-4 bg-neutral-900 active:bg-neutral-700 rounded-2xl border border-neutral-800 flex justify-between items-center px-5 transition-colors"
              >
                <span className="text-white font-black text-lg">{n}×</span>
                <span className="text-neutral-400 text-sm">
                  {n === 1 ? "À vista" : `${fmtAmt(perPart)} sem juros`}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onPointerDown={handleDecline}
          className="mx-5 mb-8 py-3 rounded-2xl border border-red-500/40 text-red-400 text-sm font-bold"
        >
          CANCELAR
        </button>
      </div>
    );
  }

  // ── CARD TYPE ─────────────────────────────────────────────────────────────
  if (screen === "card_type") {
    return (
      <div className="min-h-screen bg-black flex flex-col select-none">
        <div className="bg-neutral-900 px-5 py-4 border-b border-neutral-800">
          <p className="text-green-400 text-xs font-bold tracking-widest">TIPO DE PAGAMENTO</p>
          <p className="text-white font-black text-2xl">{fmtAmt(tx!.amount)}</p>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 gap-4">
          <button
            onPointerDown={() => { setCardType("debit"); setScreen("pin"); }}
            className="w-full py-8 bg-neutral-900 active:bg-neutral-700 rounded-3xl border border-neutral-700 transition-colors"
          >
            <p className="text-white font-black text-2xl tracking-wider">DÉBITO</p>
            <p className="text-neutral-500 text-sm mt-1">À vista</p>
          </button>
          <button
            onPointerDown={() => { setCardType("credit"); setScreen("installments"); }}
            className="w-full py-8 bg-neutral-900 active:bg-neutral-700 rounded-3xl border border-neutral-700 transition-colors"
          >
            <p className="text-white font-black text-2xl tracking-wider">CRÉDITO</p>
            <p className="text-neutral-500 text-sm mt-1">À vista ou parcelado</p>
          </button>
        </div>
        <button
          onPointerDown={handleDecline}
          className="mx-6 mb-8 py-3 rounded-2xl border border-red-500/40 text-red-400 text-sm font-bold"
        >
          CANCELAR
        </button>
      </div>
    );
  }

  // ── INSERT CARD ───────────────────────────────────────────────────────────
  if (screen === "insert_card") {
    return (
      <div className="min-h-screen bg-black flex flex-col select-none">
        <div className="bg-neutral-900 px-5 py-4 border-b border-neutral-800">
          <p className="text-green-400 text-xs font-bold tracking-widest">NOVO PAGAMENTO</p>
          <p className="text-white font-black text-3xl">{fmtAmt(tx!.amount)}</p>
          {tx!.description && <p className="text-neutral-500 text-xs mt-1">{tx!.description}</p>}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          {/* Card animation */}
          <div className="w-48 h-32 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-600 flex items-center justify-center shadow-2xl">
            <div className="w-10 h-8 bg-yellow-500/80 rounded-md" />
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-lg">Insira ou aproxime</p>
            <p className="text-neutral-500 text-sm mt-1">o cartão do cliente</p>
          </div>

          <div className="flex gap-2">
            {[0,1,2].map((i) => (
              <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />
            ))}
          </div>
        </div>

        {/* Simulate card tap */}
        <div className="px-6 pb-10 space-y-3">
          <button
            onPointerDown={() => setScreen("card_type")}
            className="w-full py-5 rounded-2xl bg-green-600 active:bg-green-500 text-white font-black text-xl tracking-wide transition-colors"
          >
            SIMULAR CARTÃO
          </button>
          <button
            onPointerDown={handleDecline}
            className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 text-sm font-bold"
          >
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  return <IdleScreen dots={dots} />;
}

function IdleScreen({ dots }: { dots: string }) {
  const [debugResult, setDebugResult] = useState<string | null>(null);
  const [checking, setChecking]       = useState(false);

  async function checkApi() {
    setChecking(true);
    try {
      const res  = await fetch("/api/terminal");
      const data = await res.json();
      setDebugResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setDebugResult("ERRO: " + String(e));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6 select-none">
      <div className="w-16 h-10 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl border border-neutral-600 flex items-center justify-center">
        <div className="w-7 h-5 bg-yellow-500/70 rounded" />
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl tracking-widest">TERMINAL</p>
        <p className="text-green-400 text-sm tracking-widest mt-1">PRONTO{dots}</p>
      </div>
      <p className="text-neutral-700 text-xs text-center">Aguardando pagamento do caixa</p>

      {/* Debug: testar API diretamente */}
      <div className="w-full max-w-xs space-y-2">
        <button
          onPointerDown={checkApi}
          disabled={checking}
          className="w-full py-3 rounded-xl border border-neutral-700 text-neutral-500 text-xs font-mono active:bg-neutral-900"
        >
          {checking ? "consultando..." : "⚙ Testar API"}
        </button>
        {debugResult && (
          <pre className="text-[10px] text-green-400 font-mono bg-neutral-900 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap">
            {debugResult}
          </pre>
        )}
      </div>
    </div>
  );
}
