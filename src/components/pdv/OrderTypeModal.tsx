"use client";

import { useState, useMemo } from "react";
import { OrderType, FlowPlatform, FlowPayment } from "@/store/useFlowStore";
import { useCRMStore } from "@/store/useCRMStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useCepLookup } from "@/hooks/useCepLookup";
import { sendWhatsAppWelcome } from "@/lib/whatsapp";

interface OrderTypeModalProps {
  onConfirm: (data: {
    type: OrderType;
    platform: FlowPlatform;
    customer: string;
    table?: string;
    phone?: string;
    address?: string;
    neighborhood?: string;
    paymentMethod: FlowPayment;
  }) => void;
  onClose: () => void;
}

const platforms: { id: FlowPlatform; label: string; color: string }[] = [
  { id: "proprio",  label: "Próprio",  color: "border-brand-primary/50 text-brand-primary" },
  { id: "ifood",    label: "iFood",    color: "border-red-400/50 text-red-400" },
  { id: "rappi",    label: "Rappi",    color: "border-orange-400/50 text-orange-400" },
  { id: "anota_ai", label: "Anota AI", color: "border-blue-400/50 text-blue-400" },
  { id: "whatsapp", label: "WhatsApp", color: "border-green-400/50 text-green-400" },
];

const inputCls = "w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors";

/** Formata número de telefone brasileiro enquanto o usuário digita */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <=  2) return d;
  if (d.length <=  6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function OrderTypeModal({ onConfirm, onClose }: OrderTypeModalProps) {
  const crmCustomers      = useCRMStore((s) => s.customers);
  const upsertCRMCustomer = useCRMStore((s) => s.upsertCustomer);
  const deliveryConfig = useConfigStore((s) => s.config.delivery);

  const [type, setType]         = useState<OrderType>("local");
  const [platform, setPlatform] = useState<FlowPlatform>("proprio");
  const [payment, setPayment]   = useState<FlowPayment>("pix");
  const [customer, setCustomer] = useState("");
  const [table, setTable]       = useState("");
  const [phone, setPhone]       = useState("");

  // Address fields
  const [addrStreet, setAddrStreet]         = useState("");
  const [addrHouseNum, setAddrHouseNum]     = useState("");
  const [addrComplement, setAddrComplement] = useState("");
  const [neighborhood, setNeighborhood]     = useState("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitted, setSubmitted]             = useState(false);

  const cepLookup = useCepLookup({
    onFill: (d) => {
      if (d.logradouro) setAddrStreet(d.logradouro);
      if (d.bairro)     setNeighborhood(d.bairro);
    },
  });

  // ── Busca no CRM ────────────────────────────────────────────────────────────
  const suggestions = useMemo(() => {
    const q = customer.trim().toLowerCase();
    if (q.length < 2) return [];
    return crmCustomers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      )
      .slice(0, 6);
  }, [customer, crmCustomers]);

  const isNewCustomer =
    (type === "delivery" || type === "takeaway") &&
    customer.trim().length >= 2 &&
    suggestions.length === 0;

  function selectCustomer(c: typeof crmCustomers[0]) {
    setCustomer(c.name);
    setPhone(c.phone);
    if (c.address)           setAddrStreet(c.address);
    if (c.addressNumber)     setAddrHouseNum(c.addressNumber);
    if (c.addressComplement) setAddrComplement(c.addressComplement);
    if (c.neighborhood)      setNeighborhood(c.neighborhood);
    setShowSuggestions(false);
  }

  // ── Confirmar ────────────────────────────────────────────────────────────────
  function handleConfirm() {
    setSubmitted(true);

    // Nome obrigatório em todos os tipos
    const customerName = customer.trim();
    if (!customerName) return;

    const name = type === "local"
      ? customerName + (table ? ` — Mesa ${table}` : "")
      : customerName;

    // Cadastra ou atualiza cliente no CRM pelo telefone
    if ((type === "delivery" || type === "takeaway") && customer.trim() && name !== "Cliente") {
      upsertCRMCustomer({
        name,
        phone:             phone.trim(),
        tags:              ["novo"],
        address:           addrStreet.trim()    || undefined,
        addressNumber:     addrHouseNum.trim()  || undefined,
        addressComplement: addrComplement.trim()|| undefined,
        neighborhood:      neighborhood.trim()  || undefined,
      });

      // Boas-vindas via WhatsApp apenas para clientes realmente novos
      if (isNewCustomer && phone.trim()) {
        sendWhatsAppWelcome({ name, phone: phone.trim() });
      }
    }

    const fullAddress = type === "delivery" && addrStreet.trim()
      ? [
          addrStreet.trim(),
          addrHouseNum.trim() ? `nº ${addrHouseNum.trim()}` : "",
          addrComplement.trim(),
        ].filter(Boolean).join(", ")
      : undefined;

    onConfirm({
      type,
      platform,
      paymentMethod: payment,
      customer:     name,
      table:        type === "local" ? (table ? `Mesa ${table}` : "Balcão") : undefined,
      phone:        phone.trim()        || undefined,
      address:      fullAddress,
      neighborhood: type === "delivery" ? neighborhood.trim() || undefined : undefined,
    });
  }

  // Opções de pagamento — maquineta só aparece em delivery
  const payments: { id: FlowPayment; label: string; icon: string }[] = [
    { id: "pix",  label: "PIX",     icon: "⚡" },
    { id: "card", label: "Cartão",  icon: "💳" },
    { id: "cash", label: "Dinheiro",icon: "💵" },
    ...(type === "delivery"
      ? [{ id: "card_delivery" as FlowPayment, label: "Maquineta 🏍️", icon: "📲" }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-[500px] shadow-card overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="font-bold text-neutral-100">Confirmar Pedido</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[78vh] overflow-y-auto scrollbar-thin">

          {/* Tipo de pedido */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Tipo de pedido</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "local",    label: "Mesa / Balcão", icon: "🪑" },
                { id: "delivery", label: "Delivery",       icon: "🏍️" },
                { id: "takeaway", label: "Retirada",       icon: "🥡" },
              ] as { id: OrderType; label: string; icon: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id);
                    if (t.id !== "delivery" && payment === "card_delivery") setPayment("pix");
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                    type === t.id
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mesa / Balcão */}
          {type === "local" && (
            <div className="space-y-3">
              {/* Nome do cliente — obrigatório */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium flex items-center gap-1">
                  Nome do cliente
                  <span className="text-brand-primary">*</span>
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">🔍</span>
                  <input
                    type="text"
                    placeholder="Nome ou telefone..."
                    value={customer}
                    onChange={(e) => { setCustomer(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    className={`${inputCls} pl-9 ${submitted && !customer.trim() ? "border-red-500/70 bg-red-500/5" : ""}`}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      className="absolute z-20 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-xl overflow-hidden shadow-xl"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCustomer(c)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-600 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-300 shrink-0">
                            {c.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-100">{c.name}</p>
                            <p className="text-xs text-neutral-500">{c.phone} · {c.totalOrders} pedidos</p>
                          </div>
                          {c.tags.includes("vip") && (
                            <span className="text-xs text-yellow-400 shrink-0">💎 VIP</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {submitted && !customer.trim() && (
                  <p className="text-xs text-red-400 mt-1 px-1">Informe o nome do cliente</p>
                )}
              </div>

              {/* Número da mesa */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium">Mesa (opcional)</p>
                <input
                  type="text"
                  placeholder="Ex: 05"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Delivery / Takeaway */}
          {(type === "delivery" || type === "takeaway") && (
            <div className="space-y-3">

              {/* Busca de cliente */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium flex items-center gap-2">
                  Buscar cliente
                  <span className="text-neutral-600">(ou digite novo)</span>
                  {isNewCustomer && (
                    <span className="ml-auto bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✦ Será cadastrado
                    </span>
                  )}
                </p>

                {/* Input + dropdown wrapper */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">🔍</span>
                  <input
                    type="text"
                    placeholder="Nome ou telefone..."
                    value={customer}
                    onChange={(e) => { setCustomer(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    className={`${inputCls} pl-9`}
                  />

                  {/* Dropdown — onMouseDown preventDefault evita que o blur feche antes do click */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      className="absolute z-20 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-xl overflow-hidden shadow-xl"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCustomer(c)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-600 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-300 shrink-0">
                            {c.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-100">{c.name}</p>
                            <p className="text-xs text-neutral-500">{c.phone} · {c.totalOrders} pedidos</p>
                          </div>
                          {c.tags.includes("vip") && (
                            <span className="text-xs text-yellow-400 shrink-0">💎 VIP</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Telefone com formatação automática */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium flex items-center gap-1">
                  Telefone / WhatsApp
                  {isNewCustomer && phone.trim() && (
                    <span className="text-green-500 text-[10px] font-semibold ml-1">· boas-vindas será enviado</span>
                  )}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="(24) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className={inputCls}
                />
              </div>

              {/* Info cadastro automático */}
              {isNewCustomer && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-xl px-3 py-2.5">
                  <span className="text-green-400 text-base shrink-0">✦</span>
                  <p className="text-xs text-green-300">
                    Cliente novo — será cadastrado automaticamente no CRM com nome, telefone e endereço.
                    {phone.trim() ? " Mensagem de boas-vindas será enviada via WhatsApp." : ""}
                  </p>
                </div>
              )}

              {/* Endereço de entrega */}
              {type === "delivery" && (
                <>
                  <div className="flex gap-2 bg-neutral-700/50 border border-neutral-600 rounded-xl px-4 py-2.5 text-xs text-neutral-400">
                    <span>🏍️ Taxa: <b className="text-white">R$ {deliveryConfig.fee.toFixed(2).replace(".", ",")}</b></span>
                    <span>·</span>
                    <span>⏱ ~<b className="text-white">{deliveryConfig.estimatedMinutes} min</b></span>
                    {deliveryConfig.freeAbove > 0 && (
                      <>
                        <span>·</span>
                        <span>Grátis acima de <b className="text-green-400">R$ {deliveryConfig.freeAbove.toFixed(0)}</b></span>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500 mb-2 font-medium">Endereço de entrega</p>
                    <div className="space-y-2">

                      {/* CEP */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="CEP (preenchimento automático)"
                          value={cepLookup.formatted}
                          onChange={(e) => cepLookup.handleChange(e.target.value)}
                          inputMode="numeric"
                          maxLength={9}
                          className={`${inputCls} pr-10 ${cepLookup.error ? "border-red-500/60" : ""}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                          {cepLookup.loading ? (
                            <span className="animate-spin inline-block text-neutral-400">⟳</span>
                          ) : cepLookup.error ? (
                            <span className="text-red-400">✕</span>
                          ) : cepLookup.cep.length === 8 ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-neutral-500">📮</span>
                          )}
                        </span>
                      </div>
                      {cepLookup.error && (
                        <p className="text-xs text-red-400 -mt-1 px-1">CEP não encontrado</p>
                      )}

                      <input
                        type="text"
                        placeholder="Rua / Avenida"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        className={inputCls}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Número da casa / apto *"
                          value={addrHouseNum}
                          onChange={(e) => setAddrHouseNum(e.target.value)}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Complemento (bloco, apto, referência…)"
                        value={addrComplement}
                        onChange={(e) => setAddrComplement(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Plataforma */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Plataforma</p>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    platform === p.id
                      ? `bg-neutral-700 ${p.color}`
                      : "bg-neutral-700 border-neutral-600 text-neutral-500 hover:border-neutral-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Pagamento</p>
            <div className={`grid gap-2 ${payments.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
              {payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                    payment === p.id
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              {payment === "card_delivery" && "📲 Pedido vai para a cozinha agora. Motoboy cobra com a maquineta na entrega."}
              {payment === "cash"          && "💵 Troco calculado na próxima tela."}
              {(payment === "pix" || payment === "card") && "⚡ Pedido vai para a cozinha após confirmação do pagamento."}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-neutral-400 border border-neutral-700 hover:border-neutral-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-500 text-white transition-colors shadow-lg"
          >
            {payment === "cash"          ? "Receber & Confirmar 💵"
              : payment === "card_delivery" ? "Enviar para Cozinha 🏍️"
              : "Ir para Pagamento →"}
          </button>
        </div>
      </div>
    </div>
  );
}
