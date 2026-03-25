"use client";

import { useState } from "react";
import { useFlowStore, FlowMotoboy } from "@/store/useFlowStore";
import { useMotoboysAuthStore } from "@/store/useMotoboysAuthStore";

export default function MotoboyLogin() {
  const motoboys = useFlowStore((s) => s.motoboys);
  const loginAs = useMotoboysAuthStore((s) => s.loginAs);
  const [selected, setSelected] = useState<FlowMotoboy | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (selected && next === selected.pin) {
          loginAs(selected);
          if ("Notification" in window) Notification.requestPermission();
        } else {
          setPinError(true);
          setPin("");
        }
      }, 300);
    }
  }

  if (!selected) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <span className="text-5xl">🏍️</span>
          <h1 className="text-2xl font-black text-white mt-3">Portal Motoboy</h1>
          <p className="text-sm text-neutral-500 mt-1">Selecione seu perfil para entrar</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          {motoboys.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="w-full flex items-center gap-4 p-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/50 rounded-2xl transition-all active:scale-98"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 font-black text-lg flex items-center justify-center shrink-0">
                {m.avatar}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{m.name}</p>
                <p className="text-xs text-neutral-500">{m.vehicle} · {m.plate}</p>
              </div>
              <span className="ml-auto text-neutral-700">›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative">
      <button
        onClick={() => { setSelected(null); setPin(""); }}
        className="absolute top-5 left-5 text-neutral-500 hover:text-white text-sm transition-colors"
      >
        ← Voltar
      </button>

      <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 font-black text-xl flex items-center justify-center mb-4">
        {selected.avatar}
      </div>
      <p className="text-white font-bold text-lg">{selected.name}</p>
      <p className="text-xs text-neutral-500 mt-1 mb-8">Digite seu PIN de 4 dígitos</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
              pinError
                ? "bg-red-500"
                : i < pin.length
                ? "bg-orange-500 scale-110"
                : "bg-neutral-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mb-7 h-4 transition-opacity ${pinError ? "text-red-400 opacity-100" : "opacity-0"}`}>
        PIN incorreto. Tente novamente.
      </p>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((d, i) => (
          <button
            key={i}
            onClick={() => {
              if (d === "⌫") setPin((p) => p.slice(0, -1));
              else if (d !== "") handleDigit(String(d));
            }}
            className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 ${
              d === ""
                ? "invisible"
                : d === "⌫"
                ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 text-base"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-700 mt-8">PIN definido pelo gerente no cadastro</p>
    </div>
  );
}
