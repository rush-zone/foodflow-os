"use client";

import { useUpsell } from "@/hooks/useUpsell";
import { useOrderStore } from "@/store/useOrderStore";
import { useEffect, useState } from "react";
import { products } from "@/data/products";

export default function ComboDetector() {
  const { activeCombo, nearCombo } = useUpsell();
  const addItem = useOrderStore((s) => s.addItem);
  const setDiscount = useOrderStore((s) => s.setDiscount);
  const discount = useOrderStore((s) => s.discount);

  const [appliedComboId, setAppliedComboId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Auto-remove discount if combo no longer qualifies
  useEffect(() => {
    if (!activeCombo && appliedComboId) {
      setDiscount(0);
      setAppliedComboId(null);
    }
  }, [activeCombo, appliedComboId, setDiscount]);

  function applyCombo() {
    if (!activeCombo) return;
    setDiscount(activeCombo.discount);
    setAppliedComboId(activeCombo.id);
  }

  // Active combo — show apply button (if not already applied)
  if (activeCombo && appliedComboId !== activeCombo.id && dismissed !== activeCombo.id) {
    return (
      <div className="mx-4 mb-3 bg-green-500/10 border border-green-500/30 rounded-2xl p-3 animate-slide-in">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-green-400 flex items-center gap-1">
              <span>{activeCombo.emoji}</span>
              <span>{activeCombo.name} disponível!</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{activeCombo.description}</p>
          </div>
          <button
            onClick={() => setDismissed(activeCombo.id)}
            className="text-neutral-600 hover:text-neutral-400 text-xs shrink-0"
          >
            ✕
          </button>
        </div>
        <button
          onClick={applyCombo}
          className="mt-2 w-full py-1.5 bg-green-500 hover:bg-green-400 text-neutral-900 text-xs font-bold rounded-xl transition-colors"
        >
          Aplicar desconto de R$ {activeCombo.discount.toFixed(2).replace(".", ",")}
        </button>
      </div>
    );
  }

  // Combo applied — show confirmation
  if (activeCombo && appliedComboId === activeCombo.id) {
    return (
      <div className="mx-4 mb-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-3 py-2 animate-fade-in">
        <p className="text-xs text-green-400 font-bold flex items-center gap-1">
          <span>✓</span>
          <span>{activeCombo.emoji} {activeCombo.name} aplicado — R$ {activeCombo.discount.toFixed(2).replace(".", ",")} de desconto</span>
        </p>
      </div>
    );
  }

  // Near combo — 1 item away
  if (nearCombo && dismissed !== `near_${nearCombo.combo.id}`) {
    const missingProduct = nearCombo.missing[0];
    return (
      <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 animate-slide-in">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <span>{nearCombo.combo.emoji}</span>
              <span>Quase lá! Falta 1 item para o {nearCombo.combo.name}</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Adicione <strong className="text-neutral-300">{missingProduct.name}</strong> e ganhe R${" "}
              {nearCombo.combo.discount.toFixed(2).replace(".", ",")} de desconto
            </p>
          </div>
          <button
            onClick={() => setDismissed(`near_${nearCombo.combo.id}`)}
            className="text-neutral-600 hover:text-neutral-400 text-xs shrink-0"
          >
            ✕
          </button>
        </div>
        <button
          onClick={() => addItem(missingProduct)}
          className="mt-2 w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 text-xs font-bold rounded-xl transition-colors"
        >
          + Adicionar {missingProduct.name} (R$ {missingProduct.price.toFixed(2).replace(".", ",")})
        </button>
      </div>
    );
  }

  return null;
}
