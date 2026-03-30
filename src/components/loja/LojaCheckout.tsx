"use client";

import { useState, useEffect, useRef } from "react";
import { useCepLookup } from "@/hooks/useCepLookup";
import { useLojaCartStore } from "@/store/useLojaCartStore";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";
import { useFlowStore, FlowPayment } from "@/store/useFlowStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useMenuStore } from "@/store/useMenuStore";
import { useEstoqueStore } from "@/store/useEstoqueStore";
import { useCRMStore } from "@/store/useCRMStore";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  onBack: () => void;
  onConfirmed: (orderNumber: string) => void;
}

const payments: { id: FlowPayment; label: string; icon: string }[] = [
  { id: "pix",  label: "PIX",      icon: "⚡" },
  { id: "card", label: "Cartão",   icon: "💳" },
  { id: "cash", label: "Dinheiro", icon: "💵" },
];

const inputCls    = "w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all";
const inputErrCls = "w-full bg-red-50 border border-red-300 rounded-2xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";

type GeoState = "idle" | "loading" | "same" | "different" | "denied";

export default function LojaCheckout({ onBack, onConfirmed }: Props) {
  const { items, subtotal, clear } = useLojaCartStore();
  const createOrder       = useFlowStore((s) => s.createOrder);
  const upsertCRMCustomer = useCRMStore((s) => s.upsertCustomer);
  const config            = useConfigStore((s) => s.config);
  const session      = useLojaCustomerStore((s) => s.session);
  const saveAddress  = useLojaCustomerStore((s) => s.saveAddress);
  const savedAddress = session?.savedAddress ?? null;

  const [name, setName]               = useState(session?.name  ?? "");
  const [phone, setPhone]             = useState(session?.phone ?? "");
  const [type, setType]               = useState<"delivery" | "takeaway">("delivery");
  const [useNewAddress, setUseNewAddress] = useState(!savedAddress);
  const [street, setStreet]           = useState(savedAddress?.street       ?? "");
  const [addrNumber, setAddrNumber]   = useState(savedAddress?.number       ?? "");
  const [neighborhood, setNeighborhood] = useState(savedAddress?.neighborhood ?? "");
  const [complement, setComplement]   = useState(savedAddress?.complement   ?? "");
  const [payment, setPayment]         = useState<FlowPayment>("pix");
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [splitBill, setSplitBill]     = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);

  const [geoState, setGeoState]           = useState<GeoState>("idle");
  const [geoSuggestion, setGeoSuggestion] = useState<{ street: string; neighborhood: string } | null>(null);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Geolocation check — runs when delivery is selected
  useEffect(() => {
    if (type !== "delivery" || typeof navigator === "undefined" || !navigator.geolocation) return;
    setGeoState("loading");

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        coordsRef.current = { lat, lng };

        if (!savedAddress?.lat || !savedAddress?.lng) {
          setGeoState("same");
          return;
        }

        const dist = haversineKm(savedAddress.lat, savedAddress.lng, lat, lng);
        if (dist > 1) {
          try {
            const res  = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { "Accept-Language": "pt-BR,pt;q=0.9" } }
            );
            const data = await res.json();
            const st = data.address?.road ?? data.address?.pedestrian ?? "";
            const nb =
              data.address?.suburb ??
              data.address?.neighbourhood ??
              data.address?.quarter ??
              "";
            if (st) setGeoSuggestion({ street: st, neighborhood: nb });
          } catch { /* ignore */ }
          setGeoState("different");
        } else {
          setGeoState("same");
        }
      },
      () => setGeoState("denied"),
      { timeout: 6000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const cepLookup = useCepLookup({
    onFill: (d) => {
      if (d.logradouro) setStreet(d.logradouro);
      if (d.bairro)     setNeighborhood(d.bairro);
    },
  });

  function switchToSaved() {
    if (!savedAddress) return;
    setStreet(savedAddress.street);
    setAddrNumber(savedAddress.number);
    setNeighborhood(savedAddress.neighborhood);
    setComplement(savedAddress.complement);
    setUseNewAddress(false);
  }

  function applyGeoSuggestion() {
    if (geoSuggestion) {
      setStreet(geoSuggestion.street);
      setNeighborhood(geoSuggestion.neighborhood);
      setAddrNumber("");
      setComplement("");
    }
    setUseNewAddress(true);
  }

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
      const perPerson = splitBill ? parseFloat((total / splitPeople).toFixed(2)) : undefined;
      const id = createOrder({
        type,
        platform:      "proprio",
        customer:      name.trim(),
        phone:         phone.trim(),
        address:       fullAddress,
        neighborhood:  type === "delivery" ? neighborhood.trim() : undefined,
        paymentMethod: payment,
        splitBill: splitBill
          ? {
              people: splitPeople,
              parts: Array.from({ length: splitPeople }, (_, i) => ({
                amount: i === splitPeople - 1
                  ? parseFloat((total - (perPerson! * (splitPeople - 1))).toFixed(2))
                  : perPerson!,
                method: payment === "cash" ? "cash" : "card",
              })),
            }
          : undefined,
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
      useLojaCustomerStore.getState().setActiveOrder(id);

      // Sincroniza com CRM: cadastra ou atualiza pelo telefone
      useCRMStore.getState().upsertCustomer({
        name:          name.trim(),
        phone:         phone.trim(),
        tags:          ["novo"],
        address:       type === "delivery" ? street.trim()       || undefined : undefined,
        addressNumber: type === "delivery" ? addrNumber.trim()   || undefined : undefined,
        neighborhood:  type === "delivery" ? neighborhood.trim() || undefined : undefined,
        addressComplement: type === "delivery" ? complement.trim() || undefined : undefined,
      });

      // Persist delivery address for next order
      if (type === "delivery") {
        saveAddress({
          street:       street.trim(),
          number:       addrNumber.trim(),
          neighborhood: neighborhood.trim(),
          complement:   complement.trim(),
          cep:          cepLookup.cep || savedAddress?.cep || "",
          lat:          coordsRef.current?.lat,
          lng:          coordsRef.current?.lng,
        });
      }

      clear();
      setLoading(false);
      onConfirmed(String(order?.number ?? id));
    }, 800);
  }

  return (
    <div className="h-screen bg-white text-neutral-900 flex flex-col overflow-hidden">
      {/* Red accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary shrink-0" />
      <header className="shrink-0 bg-white/95 backdrop-blur border-b border-neutral-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-neutral-500 hover:text-neutral-800 transition-colors">←</button>
        <h1 className="text-lg font-black text-neutral-900">Finalizar pedido</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-10">

        {/* ── Tipo ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Como quer receber?</p>
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
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 shadow-sm"
                }`}
              >
                <p>{t.label}</p>
                <p className="text-xs font-normal text-neutral-400 mt-0.5">{t.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Dados pessoais ── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Seus dados</p>

          <input
            placeholder="Seu nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={submitted && !name.trim() ? inputErrCls : inputCls}
          />
          {submitted && !name.trim() && (
            <p className="text-xs text-red-500 -mt-1 px-1">Informe seu nome</p>
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
            <p className="text-xs text-red-500 -mt-1 px-1">WhatsApp obrigatório para contato e atualizações do pedido</p>
          )}
        </section>

        {/* ── Endereço ── */}
        {type === "delivery" && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Endereço de entrega</p>

            {/* ── Saved address card (when logged in and has address) ── */}
            {savedAddress && !useNewAddress ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-lg shrink-0 mt-0.5">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 leading-snug">
                        {savedAddress.street}, {savedAddress.number}
                        {savedAddress.complement ? ` — ${savedAddress.complement}` : ""}
                      </p>
                      {savedAddress.neighborhood && (
                        <p className="text-xs text-neutral-500 mt-0.5">{savedAddress.neighborhood}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                      Salvo
                    </span>
                  </div>
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="mt-3 text-xs text-brand-primary font-bold hover:underline"
                  >
                    Alterar endereço →
                  </button>
                </div>

                {/* Geolocation different-location banner */}
                {geoState === "different" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl shrink-0">📡</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800">Você está em outro local</p>
                      {geoSuggestion ? (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Detectamos: {geoSuggestion.street}
                          {geoSuggestion.neighborhood ? `, ${geoSuggestion.neighborhood}` : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Sua localização atual é diferente do endereço salvo.
                        </p>
                      )}
                      <button
                        onClick={applyGeoSuggestion}
                        className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Entregar neste local →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Back to saved link */}
                {savedAddress && useNewAddress && (
                  <button
                    onClick={switchToSaved}
                    className="text-xs text-brand-primary font-bold hover:underline"
                  >
                    ← Usar endereço salvo
                  </button>
                )}

                {/* CEP lookup */}
                <div className="relative">
                  <input
                    placeholder="CEP (preenchimento automático)"
                    value={cepLookup.formatted}
                    onChange={(e) => cepLookup.handleChange(e.target.value)}
                    inputMode="numeric"
                    maxLength={9}
                    className={`${inputCls} pr-10 ${cepLookup.error ? "border-red-400/60" : ""}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                    {cepLookup.loading ? (
                      <span className="animate-spin inline-block">⟳</span>
                    ) : cepLookup.error ? (
                      <span className="text-red-500">✕</span>
                    ) : cepLookup.cep.length === 8 ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      "📮"
                    )}
                  </span>
                </div>
                {cepLookup.error && (
                  <p className="text-xs text-red-500 -mt-1 px-1">CEP não encontrado</p>
                )}

                <input
                  placeholder="Rua / Avenida *"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={submitted && !streetOk ? inputErrCls : inputCls}
                />
                {submitted && !streetOk && (
                  <p className="text-xs text-red-500 -mt-1 px-1">Informe a rua</p>
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
                      <p className="text-xs text-red-500 mt-1 px-1">Obrigatório</p>
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
              </>
            )}
          </section>
        )}

        {/* ── Pagamento ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Pagamento</p>
          <div className="grid grid-cols-3 gap-2">
            {payments.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={`py-3 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  payment === p.id
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 shadow-sm"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Dividir conta ── */}
        <section>
          <button
            onClick={() => { setSplitBill(!splitBill); setSplitPeople(2); }}
            className={`w-full py-3 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              splitBill
                ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 shadow-sm"
            }`}
          >
            <span>👥</span>
            <span>{splitBill ? "Dividindo a conta ✓" : "Dividir conta com amigos"}</span>
          </button>

          {splitBill && (
            <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">Quantas pessoas?</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}
                    className="w-8 h-8 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >−</button>
                  <span className="font-black text-neutral-900 w-4 text-center">{splitPeople}</span>
                  <button
                    onClick={() => setSplitPeople(Math.min(8, splitPeople + 1))}
                    className="w-8 h-8 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >+</button>
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-3 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600">Cada pessoa paga</span>
                  <span className="font-black text-brand-primary text-base">
                    R$ {(total / splitPeople).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Total do pedido</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 bg-neutral-100 rounded-xl px-3 py-2">
                💡 Combinem o pagamento entre vocês — cada um pode transferir via PIX ou pagar em dinheiro/débito na entrega.
              </p>
            </div>
          )}
        </section>

        {/* ── Resumo ── */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Resumo</p>
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-xs text-neutral-600">
              <span>{item.quantity}× {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="border-t border-neutral-100 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Subtotal</span>
              <span>R$ {sub.toFixed(2).replace(".", ",")}</span>
            </div>
            {type === "delivery" && (
              <div className={`flex justify-between text-xs ${hasFreeDelivery ? "text-green-600" : "text-neutral-500"}`}>
                <span>Taxa de entrega</span>
                <span>{hasFreeDelivery ? "Grátis 🎉" : `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-neutral-900 text-sm pt-1">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          {freeAbove > 0 && !hasFreeDelivery && type === "delivery" && (
            <p className="text-xs text-neutral-400 text-center pt-1">
              Frete grátis acima de R$ {freeAbove.toFixed(0)}
            </p>
          )}
        </section>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-colors shadow-lg"
        >
          {loading ? "Enviando..." : "Confirmar pedido 🚀"}
        </button>
      </div>
      </div>
    </div>
  );
}
