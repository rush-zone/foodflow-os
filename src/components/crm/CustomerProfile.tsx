"use client";

import { useState } from "react";
import { useCRMStore, CustomerTag, AddressType } from "@/store/useCRMStore";
import { useFlowStore, FlowStatus } from "@/store/useFlowStore";
import { toast } from "@/store/useToastStore";

const flowStatusLabel: Record<FlowStatus, string> = {
  pending:    "Aguardando",
  preparing:  "Em Preparo",
  ready:      "Pronto",
  picked_up:  "Coletado",
  on_the_way: "A Caminho",
  delivered:  "Entregue",
  cancelled:  "Cancelado",
};

const flowStatusColor: Record<FlowStatus, string> = {
  pending:    "text-neutral-400",
  preparing:  "text-yellow-400",
  ready:      "text-blue-400",
  picked_up:  "text-brand-primary",
  on_the_way: "text-brand-primary",
  delivered:  "text-green-400",
  cancelled:  "text-red-400",
};

const tagConfig: Record<CustomerTag, { label: string; color: string }> = {
  vip:        { label: "💎 VIP",        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  recorrente: { label: "🔄 Recorrente", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  novo:       { label: "🌱 Novo",       color: "text-green-400 bg-green-400/10 border-green-400/30" },
  inativo:    { label: "😴 Inativo",    color: "text-neutral-400 bg-neutral-400/10 border-neutral-400/30" },
};

const statusColor: Record<string, string> = {
  "Entregue":   "text-green-400",
  "A Caminho":  "text-brand-primary",
  "Em Preparo": "text-yellow-400",
  "Cancelado":  "text-red-400",
};

export default function CustomerProfile() {
  const customers       = useCRMStore((s) => s.customers);
  const selectedId      = useCRMStore((s) => s.selectedId);
  const updateNotes     = useCRMStore((s) => s.updateNotes);
  const updateCustomer  = useCRMStore((s) => s.updateCustomer);
  const sendMessage     = useCRMStore((s) => s.sendMessage);
  const templates       = useCRMStore((s) => s.templates);
  const allOrders       = useFlowStore((s) => s.orders);

  const customer = customers.find((c) => c.id === selectedId);
  const [editingNotes, setEditingNotes]   = useState(false);
  const [notes, setNotes]                 = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addrStreet, setAddrStreet]       = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrNumber, setAddrNumber]       = useState("");
  const [addrType, setAddrType]           = useState<AddressType>("casa");
  const [addrComplement, setAddrComplement] = useState("");

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600">
        <span className="text-4xl mb-2">👤</span>
        <p className="text-sm">Nenhum cliente selecionado</p>
      </div>
    );
  }

  function saveNotes() {
    if (!selectedId) return;
    updateNotes(selectedId, notes);
    setEditingNotes(false);
    toast.success("Observações salvas");
  }

  function openEditAddress() {
    if (!customer) return;
    setAddrStreet(customer.address ?? "");
    setAddrNeighborhood(customer.neighborhood ?? "");
    setAddrNumber(customer.addressNumber ?? "");
    setAddrType(customer.addressType ?? "casa");
    setAddrComplement(customer.addressComplement ?? "");
    setEditingAddress(true);
  }

  function saveAddress() {
    if (!selectedId) return;
    updateCustomer(selectedId, {
      address:           addrStreet.trim(),
      neighborhood:      addrNeighborhood.trim(),
      addressNumber:     addrNumber.trim(),
      addressType:       addrType,
      addressComplement: addrComplement.trim(),
    });
    setEditingAddress(false);
    toast.success("Endereço salvo");
  }

  // Real orders from flow store matched by phone or customer name
  const realOrders = allOrders
    .filter((o) => o.phone === customer.phone || o.customer === customer.name)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const daysSinceLastOrder = Math.floor(
    (Date.now() - customer.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Profile header */}
      <div className="px-5 py-5 border-b border-neutral-800 text-center shrink-0">
        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-xl font-bold text-neutral-300 mx-auto mb-3">
          {customer.avatar}
        </div>
        <h3 className="font-bold text-neutral-100">{customer.name}</h3>
        <p className="text-xs text-neutral-500 mt-0.5">{customer.phone}</p>
        <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
          {customer.tags.map((tag) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${tagConfig[tag].color}`}>
              {tagConfig[tag].label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 flex-1">
        {/* Stats */}
        <section>
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Resumo</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Pedidos",       value: String(customer.totalOrders), color: "text-blue-400" },
              { label: "Total gasto",   value: `R$ ${customer.totalSpent.toFixed(0)}`, color: "text-green-400" },
              { label: "Ticket médio",  value: `R$ ${customer.avgTicket.toFixed(2).replace(".", ",")}`, color: "text-brand-primary" },
              { label: "Último pedido", value: daysSinceLastOrder === 0 ? "Hoje" : `${daysSinceLastOrder}d atrás`, color: daysSinceLastOrder > 14 ? "text-red-400" : "text-neutral-300" },
            ].map((stat) => (
              <div key={stat.label} className="bg-neutral-800 rounded-xl p-3 text-center">
                <p className={`text-base font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Favorites */}
        <section>
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Favoritos</h4>
          <div className="space-y-1.5">
            {customer.favoriteItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-neutral-300">
                <span className="text-brand-primary">•</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Address */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Endereço</h4>
            <button
              onClick={openEditAddress}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {customer.address ? "Editar" : "+ Adicionar"}
            </button>
          </div>

          {editingAddress ? (
            <div className="space-y-2">
              <input
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Rua, logradouro"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-brand-primary/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={addrNumber}
                  onChange={(e) => setAddrNumber(e.target.value)}
                  placeholder="Nº da residência *"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-brand-primary/50"
                />
                <input
                  value={addrNeighborhood}
                  onChange={(e) => setAddrNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-brand-primary/50"
                />
              </div>

              {/* Tipo: Casa / Apartamento */}
              <div className="grid grid-cols-2 gap-2">
                {(["casa", "apartamento"] as AddressType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAddrType(t)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      addrType === t
                        ? "bg-brand-primary/15 border-brand-primary text-brand-primary"
                        : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600"
                    }`}
                  >
                    {t === "casa" ? "🏠 Casa" : "🏢 Apartamento"}
                  </button>
                ))}
              </div>

              {addrType === "apartamento" && (
                <input
                  value={addrComplement}
                  onChange={(e) => setAddrComplement(e.target.value)}
                  placeholder="Apto, bloco, andar..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-brand-primary/50"
                />
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={saveAddress} className="flex-1 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg">Salvar</button>
                <button onClick={() => setEditingAddress(false)} className="flex-1 py-1.5 bg-neutral-700 text-neutral-400 text-xs rounded-lg">Cancelar</button>
              </div>
            </div>
          ) : customer.address || customer.addressNumber ? (
            <div className="bg-neutral-800 rounded-xl px-3 py-2.5 space-y-1">
              {customer.address && (
                <p className="text-xs text-neutral-300">{customer.address}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {customer.addressNumber && (
                  <span className="text-xs text-white font-medium">Nº {customer.addressNumber}</span>
                )}
                {customer.addressType && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    customer.addressType === "casa"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {customer.addressType === "casa" ? "🏠 Casa" : "🏢 Apto"}
                  </span>
                )}
                {customer.neighborhood && (
                  <span className="text-xs text-neutral-500">{customer.neighborhood}</span>
                )}
              </div>
              {customer.addressComplement && (
                <p className="text-xs text-neutral-500">{customer.addressComplement}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-600 italic">Endereço não cadastrado</p>
          )}
        </section>

        {/* Order history — live from FlowStore, fallback to CRM mock data */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Histórico</h4>
            {realOrders.length > 0 && (
              <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">live</span>
            )}
          </div>
          <div className="space-y-2">
            {(realOrders.length > 0 ? realOrders : customer.orders).map((order) => {
              const isReal = "status" in order && typeof order.status !== "string";
              // FlowOrder shape
              if (realOrders.length > 0 && "timeline" in order) {
                const fo = order as typeof realOrders[0];
                return (
                  <div key={fo.id} className="bg-neutral-800 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-100">#{fo.number}</span>
                      <span className={`text-xs font-semibold ${flowStatusColor[fo.status]}`}>
                        {flowStatusLabel[fo.status]}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {fo.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-neutral-600">
                        {fo.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="text-xs font-bold text-neutral-300">
                        R$ {fo.total.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              }
              // CRM fallback
              const co = order as typeof customer.orders[0];
              return (
                <div key={co.id} className="bg-neutral-800 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-100">#{co.number}</span>
                    <span className={`text-xs font-semibold ${statusColor[co.status] ?? "text-neutral-400"}`}>
                      {co.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{co.items.join(", ")}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-neutral-600">
                      {co.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">
                      R$ {co.total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Observações</h4>
            <button
              onClick={() => { setNotes(customer.notes); setEditingNotes(true); }}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {customer.notes ? "Editar" : "+ Adicionar"}
            </button>
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/50 resize-none"
                placeholder="Preferências, observações..."
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} className="flex-1 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg">Salvar</button>
                <button onClick={() => setEditingNotes(false)} className="flex-1 py-1.5 bg-neutral-700 text-neutral-400 text-xs rounded-lg">Cancelar</button>
              </div>
            </div>
          ) : customer.notes ? (
            <p className="text-xs text-neutral-400 bg-neutral-800 rounded-xl px-3 py-2.5 leading-relaxed">
              {customer.notes}
            </p>
          ) : (
            <p className="text-xs text-neutral-600 italic">Nenhuma observação</p>
          )}
        </section>

        {/* Quick send template */}
        {customer.tags.includes("inativo") && (
          <section>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Ação Sugerida</h4>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-medium mb-2">
                😴 Cliente inativo há {daysSinceLastOrder} dias
              </p>
              <button
                onClick={() => {
                  const t = templates.find((t) => t.id === "t5");
                  if (t && selectedId) sendMessage(selectedId, t.text);
                }}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 text-xs font-bold rounded-lg transition-colors"
              >
                💎 Enviar cupom de reativação
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
