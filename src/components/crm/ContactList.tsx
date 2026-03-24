"use client";

import { useState } from "react";
import { useCRMStore, CustomerTag, AddressType } from "@/store/useCRMStore";

const tagConfig: Record<CustomerTag, { label: string; color: string }> = {
  vip:        { label: "VIP",       color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  recorrente: { label: "Recorrente",color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  novo:       { label: "Novo",      color: "text-green-400 bg-green-400/10 border-green-400/30" },
  inativo:    { label: "Inativo",   color: "text-neutral-400 bg-neutral-400/10 border-neutral-400/30" },
};

function timeAgo(date: Date) {
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NewCustomerModal({ onClose }: { onClose: () => void }) {
  const addCustomer = useCRMStore((s) => s.addCustomer);

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [street, setStreet]       = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [number, setNumber]       = useState("");
  const [type, setType]           = useState<AddressType>("casa");
  const [complement, setComplement] = useState("");

  function handleSave() {
    if (!name.trim() || !phone.trim()) return;
    addCustomer({
      name:              name.trim(),
      phone:             phone.trim(),
      tags:              ["novo"],
      address:           street.trim(),
      neighborhood:      neighborhood.trim(),
      addressNumber:     number.trim(),
      addressType:       type,
      addressComplement: complement.trim(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-[380px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700">
          <h3 className="font-bold text-white text-sm">Novo Cliente</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-sm">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Dados pessoais */}
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Dados pessoais</p>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo *"
            className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
          />
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefone / WhatsApp *"
            className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
          />

          {/* Endereço */}
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pt-1">Endereço</p>
          <input value={street} onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua, logradouro"
            className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
          />
          <div className="grid grid-cols-2 gap-2">
            <input value={number} onChange={(e) => setNumber(e.target.value)}
              placeholder="Nº da residência *"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
            />
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Bairro"
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
            />
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(["casa", "apartamento"] as AddressType[]).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  type === t
                    ? "bg-brand-primary/15 border-brand-primary text-brand-primary"
                    : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {t === "casa" ? "🏠 Casa" : "🏢 Apartamento"}
              </button>
            ))}
          </div>

          {type === "apartamento" && (
            <input value={complement} onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto, bloco, andar..."
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-brand-primary/60"
            />
          )}
        </div>

        <div className="px-5 py-4 border-t border-neutral-700 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!name.trim() || !phone.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 text-white transition-colors">
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactList() {
  const customers  = useCRMStore((s) => s.customers);
  const selectedId = useCRMStore((s) => s.selectedId);
  const select     = useCRMStore((s) => s.select);
  const [search, setSearch]       = useState("");
  const [tagFilter, setTagFilter] = useState<CustomerTag | "all">("all");
  const [showNew, setShowNew]     = useState(false);

  const filtered = customers
    .filter((c) => tagFilter === "all" || c.tags.includes(tagFilter))
    .filter((c) =>
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
    .sort((a, b) => {
      if (b.unread !== a.unread) return b.unread - a.unread;
      const aLast = a.messages.at(-1)?.timestamp ?? a.lastOrderAt;
      const bLast = b.messages.at(-1)?.timestamp ?? b.lastOrderAt;
      return bLast.getTime() - aLast.getTime();
    });

  const totalUnread = customers.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex flex-col h-full">
      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} />}

      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-100">
            Clientes
            {totalUnread > 0 && (
              <span className="ml-2 text-xs bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                {totalUnread}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs bg-brand-primary hover:bg-brand-secondary text-white font-bold px-2.5 py-1 rounded-lg transition-colors"
          >
            + Novo
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-8 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-thin shrink-0 border-b border-neutral-800">
        <button
          onClick={() => setTagFilter("all")}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tagFilter === "all" ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"}`}
        >
          Todos
        </button>
        {(Object.keys(tagConfig) as CustomerTag[]).map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
              tagFilter === tag
                ? `${tagConfig[tag].color}`
                : "bg-neutral-800 text-neutral-500 border-transparent hover:bg-neutral-700"
            }`}
          >
            {tagConfig[tag].label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((customer) => {
          const lastMsg = customer.messages.at(-1);
          const isSelected = selectedId === customer.id;

          return (
            <button
              key={customer.id}
              onClick={() => select(customer.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-neutral-800/50 transition-colors ${
                isSelected ? "bg-brand-primary/5 border-l-2 border-l-brand-primary" : "hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-300">
                    {customer.avatar}
                  </div>
                  {customer.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {customer.unread}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-neutral-100 truncate">{customer.name}</span>
                    <span className="text-xs text-neutral-600 shrink-0 ml-2">
                      {lastMsg ? timeAgo(lastMsg.timestamp) : timeAgo(customer.lastOrderAt)}
                    </span>
                  </div>

                  <p className={`text-xs truncate ${customer.unread > 0 ? "text-neutral-300 font-medium" : "text-neutral-500"}`}>
                    {lastMsg
                      ? `${lastMsg.from === "restaurant" ? "Você: " : ""}${lastMsg.text}`
                      : customer.phone}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-1 mt-1.5">
                    {customer.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full border ${tagConfig[tag].color}`}>
                        {tagConfig[tag].label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
