"use client";

import { useState } from "react";
import { useAuthStore, SYSTEM_OPERATORS, Operator, OperatorRole, ROLE_LABEL } from "@/store/useAuthStore";

const ROLE_COLOR: Record<OperatorRole, string> = {
  admin:     "text-purple-400 bg-purple-400/10 border-purple-400/30",
  gerente:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  atendente: "text-blue-400  bg-blue-400/10  border-blue-400/30",
  caixa:     "text-green-400 bg-green-400/10 border-green-400/30",
  cozinha:   "text-orange-400 bg-orange-400/10 border-orange-400/30",
};

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [selected, setSelected] = useState<Operator | null>(null);
  const [pin, setPin]   = useState("");
  const [error, setError] = useState(false);

  function handlePin(digit: string) {
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    const next = pin + digit;
    if (next.length > 4) return;
    setPin(next);
    if (next.length === 4) {
      if (selected) {
        // Demo: qualquer PIN de 4 dígitos funciona
        setTimeout(() => login(selected), 300);
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 600);
      }
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-neutral-950 gap-8 p-6">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-primary/30">
          FF
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">FoodFlow OS</h1>
          <p className="text-sm text-neutral-500">Selecione o operador para continuar</p>
        </div>
      </div>

      {!selected ? (
        /* Operator grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
          {SYSTEM_OPERATORS.map((op) => (
            <button
              key={op.id}
              onClick={() => { setSelected(op); setPin(""); setError(false); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-brand-primary/50 hover:bg-neutral-800 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-brand-primary/20 border border-neutral-700 group-hover:border-brand-primary/40 flex items-center justify-center text-lg font-bold text-neutral-300 group-hover:text-brand-primary transition-all">
                {op.avatar}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white leading-tight">{op.name}</p>
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[op.role]}`}>
                  {ROLE_LABEL[op.role]}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* PIN entry */
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          {/* Selected operator */}
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-sm font-bold text-brand-primary shrink-0">
              {selected.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">{selected.name}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLOR[selected.role]}`}>
                {ROLE_LABEL[selected.role]}
              </span>
            </div>
            <button
              onClick={() => { setSelected(null); setPin(""); }}
              className="text-neutral-600 hover:text-neutral-400 text-xs shrink-0"
            >
              trocar
            </button>
          </div>

          {/* PIN dots */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${
                  error
                    ? "bg-red-500"
                    : i < pin.length
                    ? "bg-brand-primary"
                    : "bg-neutral-700"
                }`}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
              d === "" ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  onClick={() => handlePin(d)}
                  className={`h-14 rounded-xl text-lg font-semibold transition-all ${
                    d === "⌫"
                      ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-brand-primary/20 border border-neutral-800"
                  }`}
                >
                  {d}
                </button>
              )
            ))}
          </div>

          <p className="text-xs text-neutral-600">Digite qualquer PIN de 4 dígitos</p>
        </div>
      )}
    </div>
  );
}
