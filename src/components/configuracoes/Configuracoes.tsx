"use client";

import { useState } from "react";
import { useConfigStore, AppConfig } from "@/store/useConfigStore";
import { useFlowStore } from "@/store/useFlowStore";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";
import { toast } from "@/store/useToastStore";

type Section = "restaurant" | "delivery" | "operation" | "receipt";

const tabs: { id: Section; label: string; icon: string }[] = [
  { id: "restaurant", label: "Restaurante", icon: "🏪" },
  { id: "delivery",   label: "Entrega",     icon: "🏍️" },
  { id: "operation",  label: "Operação",    icon: "🖥️" },
  { id: "receipt",    label: "Recibo",      icon: "🖨️" },
];

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60 transition-colors placeholder-neutral-600"
    />
  );
}

function NumberInput({
  value, onChange, min = 0, step = 1, prefix, suffix,
}: { value: number; onChange: (v: number) => void; min?: number; step?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">{prefix}</span>}
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2.5 text-sm text-white outline-none focus:border-brand-primary/60 transition-colors ${prefix ? "pl-8" : "pl-4"} ${suffix ? "pr-10" : "pr-4"}`}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">{suffix}</span>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-brand-primary" : "bg-neutral-700"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export default function Configuracoes() {
  const { config, updateSection, reset } = useConfigStore();
  const [active, setActive] = useState<Section>("restaurant");

  // local draft to allow saving explicitly
  const [draft, setDraft] = useState<AppConfig>(config);

  function patch<K extends keyof AppConfig>(section: K, field: keyof AppConfig[K], value: unknown) {
    setDraft((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  function save() {
    (Object.keys(draft) as Section[]).forEach((section) => {
      updateSection(section, draft[section] as never);
    });
    toast.success("Configurações salvas");
  }

  function handleReset() {
    reset();
    setDraft(useConfigStore.getState().config);
    toast.info("Configurações restauradas ao padrão");
  }

  return (
    <div className="flex h-full bg-neutral-900">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-neutral-800 flex flex-col py-4 gap-1 px-3">
        <p className="text-xs text-neutral-600 font-semibold uppercase tracking-wider px-2 mb-2">Configurações</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              active === tab.id
                ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/20"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-neutral-800 space-y-2 px-1">
          <button
            onClick={save}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Salvar
          </button>
          <button
            onClick={handleReset}
            className="w-full py-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Restaurar padrões
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
        <div className="max-w-xl space-y-6">

          {/* ─── Restaurante ─── */}
          {active === "restaurant" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">🏪 Restaurante</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Informações exibidas nos recibos e notificações</p>
              </div>
              <div className="space-y-4">
                <Field label="Nome do estabelecimento">
                  <TextInput value={draft.restaurant.name} onChange={(v) => patch("restaurant", "name", v)} placeholder="FoodFlow Burger" />
                </Field>
                <Field label="Endereço">
                  <TextInput value={draft.restaurant.address} onChange={(v) => patch("restaurant", "address", v)} placeholder="Rua das Flores, 123" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Telefone">
                    <TextInput value={draft.restaurant.phone} onChange={(v) => patch("restaurant", "phone", v)} placeholder="(11) 3000-0000" />
                  </Field>
                  <Field label="CNPJ">
                    <TextInput value={draft.restaurant.cnpj} onChange={(v) => patch("restaurant", "cnpj", v)} placeholder="00.000.000/0001-00" />
                  </Field>
                </div>
                <Field label="URL do logo" hint="Link de imagem para exibir nos recibos">
                  <TextInput value={draft.restaurant.logoUrl} onChange={(v) => patch("restaurant", "logoUrl", v)} placeholder="https://..." />
                </Field>
              </div>
            </>
          )}

          {/* ─── Entrega ─── */}
          {active === "delivery" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">🏍️ Entrega</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Parâmetros de delivery e frete</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Taxa de entrega" hint="Valor padrão cobrado por entrega">
                    <NumberInput value={draft.delivery.fee} onChange={(v) => patch("delivery", "fee", v)} step={0.5} prefix="R$" />
                  </Field>
                  <Field label="Frete grátis acima de" hint="0 = nunca grátis">
                    <NumberInput value={draft.delivery.freeAbove} onChange={(v) => patch("delivery", "freeAbove", v)} step={5} prefix="R$" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tempo estimado padrão" hint="Referência geral de minutos">
                    <NumberInput value={draft.delivery.estimatedMinutes} onChange={(v) => patch("delivery", "estimatedMinutes", v)} min={5} step={5} suffix="min" />
                  </Field>
                  <Field label="Raio de atendimento">
                    <NumberInput value={draft.delivery.radiusKm} onChange={(v) => patch("delivery", "radiusKm", v)} min={1} step={0.5} suffix="km" />
                  </Field>
                </div>

                {/* Fluxo da cozinha */}
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tempo por fluxo da cozinha</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-800/60 border border-green-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-green-400">🟢 Fluxo Normal</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Mínimo">
                          <NumberInput
                            value={draft.delivery.flowMinutes?.normal?.min ?? 30}
                            onChange={(v) => patch("delivery", "flowMinutes", { ...draft.delivery.flowMinutes, normal: { ...draft.delivery.flowMinutes?.normal, min: v } })}
                            min={5} step={5} suffix="min"
                          />
                        </Field>
                        <Field label="Máximo">
                          <NumberInput
                            value={draft.delivery.flowMinutes?.normal?.max ?? 60}
                            onChange={(v) => patch("delivery", "flowMinutes", { ...draft.delivery.flowMinutes, normal: { ...draft.delivery.flowMinutes?.normal, max: v } })}
                            min={5} step={5} suffix="min"
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="bg-neutral-800/60 border border-orange-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-orange-400">🔴 Fluxo Alto</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Mínimo">
                          <NumberInput
                            value={draft.delivery.flowMinutes?.alto?.min ?? 60}
                            onChange={(v) => patch("delivery", "flowMinutes", { ...draft.delivery.flowMinutes, alto: { ...draft.delivery.flowMinutes?.alto, min: v } })}
                            min={5} step={5} suffix="min"
                          />
                        </Field>
                        <Field label="Máximo">
                          <NumberInput
                            value={draft.delivery.flowMinutes?.alto?.max ?? 120}
                            onChange={(v) => patch("delivery", "flowMinutes", { ...draft.delivery.flowMinutes, alto: { ...draft.delivery.flowMinutes?.alto, max: v } })}
                            min={5} step={5} suffix="min"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Operação ─── */}
          {active === "operation" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">🖥️ Operação</h2>
                <p className="text-xs text-neutral-500 mt-0.5">PDV, descontos e taxas</p>
              </div>
              <div className="space-y-5">
                <Field label="Taxa de serviço" hint="0% desativa a taxa. Aplicada automaticamente no PDV.">
                  <NumberInput value={draft.operation.serviceChargePct} onChange={(v) => patch("operation", "serviceChargePct", v)} min={0} max={20} step={1} suffix="%" />
                </Field>
                <Field label="Desconto automático de combo" hint="Aplicado quando cliente pede 2+ produtos de categorias diferentes">
                  <NumberInput value={draft.operation.comboDiscountPct} onChange={(v) => patch("operation", "comboDiscountPct", v)} min={0} max={50} step={1} suffix="%" />
                </Field>
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 space-y-4">
                  <Toggle
                    checked={draft.operation.allowManualDiscount}
                    onChange={(v) => patch("operation", "allowManualDiscount", v)}
                    label="Permitir desconto manual no PDV"
                  />
                </div>
              </div>
            </>
          )}

          {/* ─── Recibo ─── */}
          {active === "receipt" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">🖨️ Recibo</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Personalização da comanda impressa</p>
              </div>
              <div className="space-y-5">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
                  <Toggle
                    checked={draft.receipt.showLogo}
                    onChange={(v) => patch("receipt", "showLogo", v)}
                    label="Exibir logo no recibo"
                  />
                </div>
                <Field label="Mensagem de rodapé">
                  <textarea
                    value={draft.receipt.footer}
                    onChange={(e) => patch("receipt", "footer", e.target.value)}
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/60 transition-colors resize-none placeholder-neutral-600"
                    placeholder="Obrigado pela preferência!"
                  />
                </Field>

                {/* Preview */}
                <div>
                  <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">Preview do recibo</p>
                  <div className="bg-white text-neutral-900 rounded-xl p-5 font-mono text-xs space-y-2 max-w-xs">
                    <p className="text-center font-bold text-sm">{draft.restaurant.name}</p>
                    <p className="text-center text-neutral-500">{draft.restaurant.address}</p>
                    <div className="border-t border-dashed border-neutral-400 my-2" />
                    <p>Pedido #00 — Mesa</p>
                    <p>Cliente: <b>João Silva</b></p>
                    <div className="border-t border-dashed border-neutral-400 my-2" />
                    <div className="flex justify-between"><span>1× X-Burger</span><span>R$ 28,90</span></div>
                    <div className="border-t border-dashed border-neutral-400 my-2" />
                    <div className="flex justify-between font-bold"><span>TOTAL</span><span>R$ 28,90</span></div>
                    <p>Pagamento: PIX</p>
                    <div className="border-t border-dashed border-neutral-400 my-2" />
                    <p className="text-center text-neutral-500 text-[11px]">{draft.receipt.footer}</p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ── Zona de perigo ── */}
        <div className="border-t border-neutral-800 mt-4 pt-4 mx-4 mb-4">
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-3">Zona de perigo</p>
          <button
            onClick={() => {
              if (!confirm("Apagar todos os pedidos? Esta ação não pode ser desfeita.")) return;
              useFlowStore.getState().resetOrders();
              // Limpa o pedido ativo da sessão do cliente na loja
              const cur = useLojaCustomerStore.getState().session;
              if (cur) {
                useLojaCustomerStore.setState({
                  session: { ...cur, activeOrderId: undefined },
                });
              }
              toast.success("Todos os pedidos foram apagados.");
            }}
            className="w-full py-2.5 rounded-xl border border-red-800/50 bg-red-900/20 text-red-400 text-sm font-semibold hover:bg-red-900/40 transition-colors"
          >
            🗑️ Limpar todos os pedidos
          </button>
        </div>

      </div>
    </div>
  );
}
