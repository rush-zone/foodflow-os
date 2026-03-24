"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const OPERATORS = [
  { id: "op1", name: "João Silva",    role: "Gerente",  avatar: "JS" },
  { id: "op2", name: "Maria Santos",  role: "Caixa",    avatar: "MS" },
  { id: "op3", name: "Carlos Lima",   role: "Atendente",avatar: "CL" },
  { id: "op4", name: "Ana Beatriz",   role: "Cozinha",  avatar: "AB" },
];

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
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
      // For demo, any 4-digit PIN works
      const op = OPERATORS.find((o) => o.id === selected);
      if (op) {
        setTimeout(() => login(op.name), 300);
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 600);
      }
    }
  }

  function handleSelectOperator(id: string) {
    setSelected(id);
    setPin("");
    setError(false);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-neutral-950 gap-8 p-6">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">
          FF
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">FoodFlow OS</h1>
          <p className="text-sm text-neutral-500">Selecione o operador para continuar</p>
        </div>
      </div>

      {!selected ? (
        /* Operator grid */
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {OPERATORS.map((op) => (
            <button
              key={op.id}
              onClick={() => handleSelectOperator(op.id)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-orange-500/20 border border-neutral-700 group-hover:border-orange-500/40 flex items-center justify-center text-lg font-bold text-neutral-300 group-hover:text-orange-400 transition-all">
                {op.avatar}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{op.name}</p>
                <p className="text-xs text-neutral-500">{op.role}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* PIN entry */
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          {/* Selected operator */}
          {(() => {
            const op = OPERATORS.find((o) => o.id === selected)!;
            return (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-sm font-bold text-orange-400">
                  {op.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{op.name}</p>
                  <p className="text-xs text-neutral-500">{op.role}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-2 text-neutral-600 hover:text-neutral-400 text-xs"
                >
                  trocar
                </button>
              </div>
            );
          })()}

          {/* PIN dots */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${
                  error
                    ? "bg-red-500"
                    : i < pin.length
                    ? "bg-orange-500"
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
                      : "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-orange-500/20 border border-neutral-800"
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
