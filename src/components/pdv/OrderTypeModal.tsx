"use client";

import { useState } from "react";
import { OrderType, FlowPlatform, FlowPayment } from "@/store/useFlowStore";

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

const payments: { id: FlowPayment; label: string; icon: string }[] = [
  { id: "pix",  label: "PIX",     icon: "⚡" },
  { id: "card", label: "Cartão",  icon: "💳" },
  { id: "cash", label: "Dinheiro",icon: "💵" },
];

export default function OrderTypeModal({ onConfirm, onClose }: OrderTypeModalProps) {
  const [type, setType] = useState<OrderType>("local");
  const [platform, setPlatform] = useState<FlowPlatform>("proprio");
  const [payment, setPayment] = useState<FlowPayment>("pix");
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  function handleConfirm() {
    const name = type === "local"
      ? (table ? `Mesa ${table}` : "Balcão")
      : customer.trim() || "Cliente";

    onConfirm({
      type,
      platform,
      paymentMethod: payment,
      customer: name,
      table: type === "local" ? (table ? `Mesa ${table}` : undefined) : undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-[480px] shadow-card overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="font-bold text-neutral-100">Confirmar Pedido</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Order type */}
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
                  onClick={() => setType(t.id)}
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

          {/* Fields by type */}
          {type === "local" && (
            <div>
              <p className="text-xs text-neutral-500 mb-2 font-medium">Mesa (opcional)</p>
              <input
                type="text"
                placeholder="Ex: 05"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
              />
            </div>
          )}

          {(type === "delivery" || type === "takeaway") && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium">Nome do cliente</p>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-2 font-medium">Telefone</p>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
                />
              </div>
              {type === "delivery" && (
                <>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2 font-medium">Endereço</p>
                    <input
                      type="text"
                      placeholder="Rua, número, complemento"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2 font-medium">Bairro</p>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Platform */}
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

          {/* Payment */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Pagamento</p>
            <div className="flex gap-2">
              {payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    payment === p.id
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-neutral-700 border-neutral-600 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
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
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors shadow-lg"
          >
            Enviar para Cozinha 🍳
          </button>
        </div>
      </div>
    </div>
  );
}
