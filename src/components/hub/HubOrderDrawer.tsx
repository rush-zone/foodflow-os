"use client";

import { useEffect } from "react";
import { FlowOrder, FlowStatus } from "@/store/useFlowStore";
import { useConfigStore } from "@/store/useConfigStore";
import HubStatusBadge from "./HubStatusBadge";

function printReceipt(order: FlowOrder) {
  const { restaurant, receipt } = useConfigStore.getState().config;
  const typeLabel = order.type === "delivery" ? "Delivery" : order.type === "takeaway" ? "Retirada" : `Mesa ${order.table ?? ""}`;
  const payLabel  = order.paymentMethod === "cash" ? "Dinheiro" : order.paymentMethod === "pix" ? "PIX" : "Cartão";
  const subtotal  = order.total + order.discount;
  const lines     = order.items
    .map((i) => `<tr><td>${i.quantity}× ${i.name}${i.notes ? `<br><small style="color:#888">⚠ ${i.notes}</small>` : ""}</td><td style="text-align:right">R$ ${(i.price * i.quantity).toFixed(2).replace(".",",")}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Pedido #${order.number}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: monospace; font-size: 13px; width: 320px; padding: 16px; }
  h1 { font-size: 18px; text-align:center; margin-bottom:4px; }
  .center { text-align:center; color:#444; }
  .divider { border-top:1px dashed #000; margin:8px 0; }
  table { width:100%; border-collapse:collapse; }
  td { padding:3px 0; vertical-align:top; }
  .total { font-size:15px; font-weight:bold; }
  .footer { margin-top:12px; text-align:center; font-size:11px; color:#555; }
</style></head><body>
${receipt.showLogo && restaurant.logoUrl ? `<img src="${restaurant.logoUrl}" style="display:block;margin:0 auto 8px;max-height:48px" />` : ""}
<h1>${restaurant.name}</h1>
<p class="center">${restaurant.address}</p>
${restaurant.phone ? `<p class="center">${restaurant.phone}</p>` : ""}
${restaurant.cnpj ? `<p class="center">CNPJ: ${restaurant.cnpj}</p>` : ""}
<div class="divider"></div>
<p>Pedido #${order.number} — ${typeLabel}</p>
<p>Cliente: <b>${order.customer}</b></p>
${order.address ? `<p>Endereço: ${order.address}</p>` : ""}
${order.phone ? `<p>Fone: ${order.phone}</p>` : ""}
<div class="divider"></div>
<table>${lines}</table>
<div class="divider"></div>
${order.discount > 0 ? `<table><tr><td>Subtotal</td><td style="text-align:right">R$ ${subtotal.toFixed(2).replace(".",",")}</td></tr><tr><td>Desconto</td><td style="text-align:right">− R$ ${order.discount.toFixed(2).replace(".",",")}</td></tr></table>` : ""}
<table><tr><td class="total">TOTAL</td><td class="total" style="text-align:right">R$ ${order.total.toFixed(2).replace(".",",")}</td></tr></table>
<p>Pagamento: ${payLabel}</p>
<div class="divider"></div>
<p>Criado: ${order.createdAt.toLocaleString("pt-BR")}</p>
<p class="footer">${receipt.footer}</p>
</body></html>`;

  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

interface Props {
  order: FlowOrder;
  onClose: () => void;
  onCancel: (id: string) => void;
}

const typeLabel: Record<string, string> = {
  local: "🪑 Mesa",
  delivery: "🏍️ Delivery",
  takeaway: "🥡 Retirada",
};

const paymentLabel: Record<string, string> = {
  cash: "💵 Dinheiro",
  pix: "⚡ PIX",
  card: "💳 Cartão",
};

const timelineLabel: Record<FlowStatus, string> = {
  pending:   "Pedido recebido",
  preparing: "Preparo iniciado",
  ready:     "Pronto para entrega",
  picked_up: "Motoboy coletou",
  on_the_way:"A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const timelineDot: Record<FlowStatus, string> = {
  pending:   "bg-blue-400",
  preparing: "bg-yellow-400",
  ready:     "bg-green-400",
  picked_up: "bg-orange-400",
  on_the_way:"bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-400",
};

function fmt(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function elapsed(from: Date, to?: Date) {
  const ms = (to ?? new Date()).getTime() - from.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

export default function HubOrderDrawer({ order, onClose, onCancel }: Props) {
  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canCancel = !["delivered", "cancelled"].includes(order.status);
  const subtotal  = order.total + order.discount;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-neutral-100">#{order.number}</span>
            <HubStatusBadge status={order.status} />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Cliente / Entrega */}
          <section className="px-5 py-4 border-b border-neutral-800 space-y-2">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">Cliente</p>
            <div className="flex items-center gap-2">
              <span className="text-base">{typeLabel[order.type]}</span>
              <span className="text-sm font-bold text-neutral-100">{order.customer}</span>
            </div>
            {order.table && (
              <p className="text-xs text-neutral-400">Mesa: {order.table}</p>
            )}
            {order.phone && (
              <p className="text-xs text-neutral-400">📞 {order.phone}</p>
            )}
            {order.address && (
              <p className="text-xs text-neutral-400">📍 {order.address}</p>
            )}
            {order.neighborhood && (
              <p className="text-xs text-neutral-500">{order.neighborhood}</p>
            )}
          </section>

          {/* Motoboy */}
          {order.motoboy && (
            <section className="px-5 py-4 border-b border-neutral-800">
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">Motoboy</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0">
                  {order.motoboy.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-100">{order.motoboy.name}</p>
                  <p className="text-xs text-neutral-500">{order.motoboy.vehicle} · {order.motoboy.plate} · {order.motoboy.phone}</p>
                </div>
              </div>
            </section>
          )}

          {/* Itens */}
          <section className="px-5 py-4 border-b border-neutral-800">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">
              Itens ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </p>
            <div className="space-y-2.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="text-sm text-neutral-200">{item.name}</p>
                      {item.notes && (
                        <p className="text-xs text-yellow-400 mt-0.5">⚠ {item.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 tabular-nums shrink-0">
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Pagamento */}
          <section className="px-5 py-4 border-b border-neutral-800 space-y-2">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-3">Pagamento</p>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-green-400">
                <span>Desconto</span>
                <span>− R$ {order.discount.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-neutral-800">
              <span className="text-sm font-bold text-neutral-100">Total</span>
              <span className="text-lg font-black text-brand-primary">
                R$ {order.total.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{paymentLabel[order.paymentMethod] ?? order.paymentMethod}</p>
          </section>

          {/* Timeline */}
          <section className="px-5 py-4">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-4">Timeline</p>
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-800" />
              <div className="space-y-4">
                {order.timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ring-2 ring-neutral-900 ${timelineDot[event.status] ?? "bg-neutral-600"}`} />
                    <div className="flex-1 flex items-baseline justify-between gap-2">
                      <p className="text-sm text-neutral-200 font-medium">
                        {timelineLabel[event.status] ?? event.status}
                      </p>
                      <span className="text-xs text-neutral-600 tabular-nums shrink-0">
                        {fmt(event.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tempo total */}
            <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-xs text-neutral-500">Tempo total</span>
              <span className="text-xs font-bold text-neutral-300 tabular-nums">
                {elapsed(order.createdAt, order.closedAt)}
              </span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-800 shrink-0 space-y-2">
          <button
            onClick={() => printReceipt(order)}
            className="w-full py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            🖨️ Imprimir comanda
          </button>
          {canCancel && (
            <button
              onClick={() => { onCancel(order.id); onClose(); }}
              className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
            >
              Cancelar pedido #{order.number}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
