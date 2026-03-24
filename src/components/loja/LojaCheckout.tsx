"use client";

import { useState } from "react";
import { useLojaCartStore } from "@/store/useLojaCartStore";
import { useFlowStore, FlowPayment } from "@/store/useFlowStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useEstoqueStore } from "@/store/useEstoqueStore";

interface Props {
  onBack: () => void;
  onConfirmed: (orderNumber: string) => void;
}

const payments: { id: FlowPayment; label: string; icon: string }[] = [
  { id: "pix",  label: "PIX",      icon: "⚡" },
  { id: "card", label: "Cartão",   icon: "💳" },
  { id: "cash", label: "Dinheiro", icon: "💵" },
];

const inputCls = "w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-primary/60 transition-colors";
const inputErrCls = "w-full bg-neutral-900 border border-red-500/60 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-red-400 transition-colors";

export default function LojaCheckout({ onBack, onConfirmed }: Props) {
  const { items, subtotal, clear } = useLojaCartStore();
  const createOrder = useFlowStore((s) => s.createOrder);
  const config      = useConfigStore((s) => s.config);

  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [type, setType]               = useState<"delivery" | "takeaway">("delivery");
  const [street, setStreet]           = useState("");
  const [addrNumber, setAddrNumber]   = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement]   = useState("");
  const [payment, setPayment]         = useState<FlowPayment>("pix");
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const deliveryFee     = type === "delivery" ? config.delivery.fee : 0;
  const freeAbove       = config.delivery.freeAbove;
  const sub             = subtotal();
  const hasFreeDelivery = freeAbove > 0 && sub >= freeAbove;
  const fee             = hasFreeDelivery ? 0 : deliveryFee;
  const total           = sub + fee;

  // Validation helpers
  const phoneOk   = phone.trim().length >= 8;
  const streetOk  = street.trim().length > 0;
  const numberOk  = addrNumber.trim().length > 0;

  const canConfirm =
    name.trim() &&
    phoneOk &&
    (type === "takeaway" || (streetOk && numberOk));

  function handleConfirm() {
    setSubmitted(true);
    if (!canConfirm || loading) return;
    setLoading(true);

    const fullAddress = type === "delivery"
      ? [street.trim(), `nº ${addrNumber.trim()}`, complement.trim()].filter(Boolean).join(", ")
      : undefined;

    setTimeout(() => {
      const id = createOrder({
        type,
        platform:      "proprio",
        customer:      name.trim(),
        phone:         phone.trim(),
        address:       fullAddress,
        neighborhood:  type === "delivery" ? neighborhood.trim() : undefined,
        paymentMethod: payment,
        items: items.map((i) => ({
          productId: i.productId,
          name:      i.name,
          quantity:  i.quantity,
          price:     i.price,
          notes:     i.notes,
        })),
        total,
        discount: 0,
      });

      const menuProducts = useMenuStore.getState().products;
      useEstoqueStore.getState().deductForSale(
        items.map((cartItem) => ({
          stockLinks: menuProducts.find((p) => p.id === cartItem.productId)?.stockLinks,
          quantity:   cartItem.quantity,
          extras:     cartItem.extras,
        }))
      );

      const order = useFlowStore.getState().orders.find((o) => o.id === id);
      clear();
      setLoading(false);
      onConfirmed(String(order?.number ?? id));
    }, 800);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur border-b border-neutral-800 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">←</button>
        <h1 className="text-lg font-black">Finalizar pedido</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-10">

        {/* ── Tipo ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Como quer receber?</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "delivery", label: "Delivery 🏍️", hint: `~${config.delivery.estimatedMinutes} min` },
              { id: "takeaway", label: "Retirar 🥡",  hint: "No balcão" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`py-3 rounded-2xl border text-sm font-bold transition-all ${
                  type === t.id
                    ? "bg-brand-primary/15 border-brand-primary text-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                <p>{t.label}</p>
                <p className="text-xs font-normal text-neutral-500 mt-0.5">{t.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Dados pessoais ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Seus dados</p>

          <input
            placeholder="Seu nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={submitted && !name.trim() ? inputErrCls : inputCls}
          />
          {submitted && !name.trim() && (
            <p className="text-xs text-red-400 -mt-1 px-1">Informe seu nome</p>
          )}

          <div className="relative">
            <input
              placeholder="WhatsApp *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className={submitted && !phoneOk ? inputErrCls : inputCls}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">📱</span>
          </div>
          {submitted && !phoneOk && (
            <p className="text-xs text-red-400 -mt-1 px-1">WhatsApp obrigatório para contato e atualizações do pedido</p>
          )}
        </section>

        {/* ── Endereço ── */}
        {type === "delivery" && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Endereço de entrega</p>

            <input
              placeholder="Rua / Avenida *"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className={submitted && !streetOk ? inputErrCls : inputCls}
            />
            {submitted && !streetOk && (
              <p className="text-xs text-red-400 -mt-1 px-1">Informe a rua</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  placeholder="Número *"
                  value={addrNumber}
                  onChange={(e) => setAddrNumber(e.target.value)}
                  className={submitted && !numberOk ? inputErrCls : inputCls}
                />
                {submitted && !numberOk && (
                  <p className="text-xs text-red-400 mt-1 px-1">Obrigatório</p>
                )}
              </div>
              <input
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className={inputCls}
              />
            </div>

            <input
              placeholder="Complemento (apto, bloco…)"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              className={inputCls}
            />
          </section>
        )}

        {/* ── Pagamento ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Pagamento</p>
          <div className="grid grid-cols-3 gap-2">
            {payments.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={`py-3 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  payment === p.id
                    ? "bg-brand-primary/15 border-brand-primary text-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Resumo ── */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Resumo</p>
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-xs text-neutral-400">
              <span>{item.quantity}× {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="border-t border-neutral-800 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Subtotal</span>
              <span>R$ {sub.toFixed(2).replace(".", ",")}</span>
            </div>
            {type === "delivery" && (
              <div className={`flex justify-between text-xs ${hasFreeDelivery ? "text-green-400" : "text-neutral-500"}`}>
                <span>Taxa de entrega</span>
                <span>{hasFreeDelivery ? "Grátis 🎉" : `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-white text-sm pt-1">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          {freeAbove > 0 && !hasFreeDelivery && type === "delivery" && (
            <p className="text-xs text-neutral-600 text-center pt-1">
              Frete grátis acima de R$ {freeAbove.toFixed(0)}
            </p>
          )}
        </section>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-colors shadow-xl"
        >
          {loading ? "Enviando..." : "Confirmar pedido 🚀"}
        </button>
      </div>
    </div>
  );
}
