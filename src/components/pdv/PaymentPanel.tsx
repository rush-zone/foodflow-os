"use client";

import { useState, useEffect, useRef } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useFlowStore } from "@/store/useFlowStore";
import { useCaixaStore } from "@/store/useCaixaStore";
import { useEstoqueStore } from "@/store/useEstoqueStore";
import { useConfigStore } from "@/store/useConfigStore";
import { toast } from "@/store/useToastStore";
import OrderTypeModal from "./OrderTypeModal";

type GatewayState = "idle" | "awaiting_pix" | "awaiting_card" | "approved" | "confirming_cash" | "split_setup" | "split_processing";

interface SplitSlot { amount: string; method: "cash" | "card"; }

import type { FlowOrder } from "@/store/useFlowStore";

function printOrder(order: FlowOrder) {
  const { restaurant, receipt } = useConfigStore.getState().config;
  const typeLabel = order.type === "delivery" ? "Delivery" : order.type === "takeaway" ? "Retirada" : `Mesa ${order.table ?? ""}`;
  const payLabel  = order.splitBill
    ? `Conta dividida (${order.splitBill.people} pessoas)`
    : order.paymentMethod === "cash" ? "Dinheiro"
    : order.paymentMethod === "pix" ? "PIX"
    : order.paymentMethod === "card_delivery" ? "Cobrar na entrega (maquininha)"
    : "Cartão/Débito";
  const lines = order.items
    .map((i) => `<tr><td>${i.quantity}× ${i.name}${i.notes ? `<br><small style="color:#888">⚠ ${i.notes}</small>` : ""}</td><td style="text-align:right">R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}</td></tr>`)
    .join("");
  const splitLines = order.splitBill
    ? order.splitBill.parts.map((p, i) =>
        `<tr><td>Pessoa ${i + 1} — ${p.method === "cash" ? "Dinheiro" : "Débito"}</td><td style="text-align:right">R$ ${p.amount.toFixed(2).replace(".", ",")}</td></tr>`
      ).join("")
    : "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Pedido #${order.number}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: monospace; font-size: 13px; width: 320px; padding: 16px; }
  h1 { font-size:18px; text-align:center; margin-bottom:4px; }
  .center { text-align:center; color:#444; }
  .divider { border-top:1px dashed #000; margin:8px 0; }
  table { width:100%; border-collapse:collapse; }
  td { padding:3px 0; vertical-align:top; }
  .total { font-size:15px; font-weight:bold; }
  .footer { margin-top:12px; text-align:center; font-size:11px; color:#555; }
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { width: 80mm !important; padding: 8px; margin: 0; }
  }
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
${order.discount > 0 ? `<table><tr><td>Subtotal</td><td style="text-align:right">R$ ${(order.total + order.discount).toFixed(2).replace(".", ",")}</td></tr><tr><td>Desconto</td><td style="text-align:right">− R$ ${order.discount.toFixed(2).replace(".", ",")}</td></tr></table>` : ""}
<table><tr><td class="total">TOTAL</td><td class="total" style="text-align:right">R$ ${order.total.toFixed(2).replace(".", ",")}</td></tr></table>
<p>Pagamento: ${payLabel}</p>
${splitLines ? `<table style="margin-top:4px;font-size:12px;color:#555">${splitLines}</table>` : ""}
<div class="divider"></div>
<p>Criado: ${order.createdAt.toLocaleString("pt-BR")}</p>
<p class="footer">${receipt.footer}</p>
</body></html>`;

  const win = window.open("", "_blank", "width=400,height=650");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function playPixSound() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, dur: number, vol = 0.4) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    play(523, 0,    0.12); // C5
    play(659, 0.14, 0.12); // E5
    play(784, 0.28, 0.18); // G5
    play(1047,0.46, 0.3);  // C6
  } catch { /* silent fail */ }
}

export default function PaymentPanel() {
  const subtotal  = useOrderStore((s) => s.subtotal());
  const total     = useOrderStore((s) => s.total());
  const discount  = useOrderStore((s) => s.discount);
  const clearOrder = useOrderStore((s) => s.clearOrder);
  const items     = useOrderStore((s) => s.items);
  const createOrder = useFlowStore((s) => s.createOrder);

  const setDiscount        = useOrderStore((s) => s.setDiscount);
  const allowManualDiscount = useConfigStore((s) => s.config.operation.allowManualDiscount);

  const [showModal, setShowModal] = useState(false);
  const [pendingData, setPendingData] = useState<Parameters<typeof createOrder>[0] | null>(null);
  const [gateway, setGateway] = useState<GatewayState>("idle");
  const [confirmed, setConfirmed] = useState(false);
  const [cashReceived, setCashReceived] = useState("");

  // Split bill
  const [isSplit, setIsSplit] = useState(false);
  const [splitSlots, setSplitSlots] = useState<SplitSlot[]>([]);
  const [splitIdx, setSplitIdx] = useState(0);
  const [splitCashReceived, setSplitCashReceived] = useState("");
  const [splitTermTxId, setSplitTermTxId] = useState<string | null>(null);
  const [splitCardStatus, setSplitCardStatus] = useState<"waiting" | "approved" | "declined" | null>(null);

  // Terminal (maquininha iPhone)
  const [termTxId, setTermTxId] = useState<string | null>(null);
  const [terminalUrls, setTerminalUrls] = useState<string[]>([]);
  const lastOrderIdRef = useRef<string | null>(null);

  // Detecta todos os IPs locais para montar as URLs do terminal
  useEffect(() => {
    const port = window.location.port || "3000";
    fetch("/api/terminal?action=ip")
      .then((r) => r.json())
      .then((d) => {
        const ips: string[] = d.ips ?? [];
        if (ips.length > 0) {
          setTerminalUrls(ips.map((ip) => `http://${ip}:${port}/terminal`));
        } else {
          setTerminalUrls([`${window.location.origin}/terminal`]);
        }
      })
      .catch(() => setTerminalUrls([`${window.location.origin}/terminal`]));
  }, []);

  // Polling: aguarda resultado da maquininha
  useEffect(() => {
    if (gateway !== "awaiting_card" || !termTxId) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch("/api/terminal?action=result");
        const data = await res.json();
        if (data.result?.id === termTxId) {
          clearInterval(interval);
          setTermTxId(null);
          if (data.result.status === "approved") {
            setGateway("approved");
          } else {
            cancelPayment();
            toast.error("Pagamento recusado", "A transação foi negada na maquininha");
          }
        }
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, termTxId]);

  // Polling: aguarda resultado da maquininha para slot de cartão dividido
  useEffect(() => {
    if (gateway !== "split_processing" || !splitTermTxId) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch("/api/terminal?action=result");
        const data = await res.json();
        if (data.result?.id === splitTermTxId) {
          clearInterval(interval);
          setSplitTermTxId(null);
          if (data.result.status === "approved") {
            setSplitCardStatus("approved");
          } else {
            setSplitCardStatus("declined");
            toast.error("Pagamento recusado", "A transação foi negada na maquininha");
          }
        }
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, splitTermTxId]);

  // Desconto manual
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountMode, setDiscountMode] = useState<"pct" | "value">("pct");
  const [discountInput, setDiscountInput] = useState("");

  function applyDiscount() {
    const raw = parseFloat(discountInput.replace(",", ".")) || 0;
    const value = discountMode === "pct"
      ? Math.min(subtotal * (raw / 100), subtotal)
      : Math.min(raw, subtotal);
    setDiscount(Math.max(0, value));
    setShowDiscount(false);
  }

  function removeDiscount() {
    setDiscount(0);
    setDiscountInput("");
    setShowDiscount(false);
  }

  function initSplitSlots(n: number, existing?: SplitSlot[]) {
    const each = parseFloat((total / n).toFixed(2));
    const last  = parseFloat((total - each * (n - 1)).toFixed(2));
    setSplitSlots(
      Array.from({ length: n }, (_, i) => ({
        amount: (i === n - 1 ? last : each).toFixed(2),
        method: existing?.[i]?.method ?? ("cash" as const),
      }))
    );
  }

  function startSplitSlot(idx: number, slots?: SplitSlot[]) {
    const activeSlots = slots ?? splitSlots;
    const slot = activeSlots[idx];
    if (!slot) return;
    setSplitIdx(idx);
    setSplitCashReceived("");
    setSplitCardStatus(null);
    setSplitTermTxId(null);
    if (slot.method === "card") {
      const slotAmt = parseFloat(slot.amount.replace(",", ".")) || 0;
      const txId = `tx_split_${Date.now()}_${idx}`;
      setSplitTermTxId(txId);
      setSplitCardStatus("waiting");
      fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          id: txId,
          amount: slotAmt,
          description: `Conta dividida — Pessoa ${idx + 1} de ${activeSlots.length}`,
        }),
      })
        .then((r) => r.json())
        .then((d) => { if (!d.ok) toast.error("Terminal: erro ao enviar cobrança"); })
        .catch(() => toast.error("Terminal offline", "Verifique a conexão de rede"));
    }
  }

  function handleModalConfirm(data: Parameters<typeof createOrder>[0]) {
    const orderData = {
      ...data,
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        notes: i.notes,
      })),
      total,
      discount,
    } as Parameters<typeof createOrder>[0];

    setPendingData(orderData);
    setShowModal(false);

    if (isSplit) {
      setIsSplit(false);
      initSplitSlots(2);
      setGateway("split_setup");
      return;
    }

    if (data.paymentMethod === "cash") {
      setCashReceived("");
      setGateway("confirming_cash");
    } else if (data.paymentMethod === "card_delivery") {
      // Payment collected on delivery — finalize immediately, no gateway screen
      finalizeOrder(orderData);
      return;
    } else if (data.paymentMethod === "pix") {
      setGateway("awaiting_pix");
      // Simulate PIX confirmation after 4s
      setTimeout(() => {
        setGateway("approved");
        playPixSound();
      }, 4000);
    } else {
      // Envia cobrança para o terminal (iPhone)
      const txId = `tx_${Date.now()}`;
      setTermTxId(txId);
      fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", id: txId, amount: total, description: `Pedido PDV — R$ ${total.toFixed(2).replace(".", ",")}` }),
      })
        .then((r) => r.json())
        .then((d) => { if (!d.ok) toast.error("Terminal: erro ao enviar cobrança"); })
        .catch(() => toast.error("Terminal offline", "Verifique a conexão de rede"));
      setGateway("awaiting_card");
    }
  }

  function finalizeOrder(dataOverride?: Parameters<typeof createOrder>[0]) {
    const data = dataOverride ?? pendingData;
    if (!data) return;
    const orderId = createOrder(data);

    // Deduzir estoque automaticamente
    useEstoqueStore.getState().deductForSale(
      items.map((i) => ({ stockLinks: i.product.stockLinks, quantity: i.quantity }))
    );

    // Auto-register cash payment in caixa if open
    if (data.paymentMethod === "cash") {
      const caixa = useCaixaStore.getState();
      if (caixa.isOpen) {
        const order = useFlowStore.getState().orders.find((o) => o.id === orderId);
        const label = order ? `Venda #${order.number} — dinheiro` : "Venda em dinheiro — PDV";
        caixa.addMovement("suprimento", total, label, true);
      }
    }

    lastOrderIdRef.current = orderId;
    const completedOrder = useFlowStore.getState().orders.find((o) => o.id === orderId);
    if (completedOrder) printOrder(completedOrder);
    toast.success("Pedido enviado para a cozinha!", `R$ ${total.toFixed(2).replace(".", ",")} — ${data.customer}`);
    setGateway("idle");
    setPendingData(null);
    setConfirmed(true);
    setTimeout(() => {
      clearOrder();
      setConfirmed(false);
    }, 6000);
  }

  function cancelPayment() {
    if (termTxId) {
      fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", id: termTxId }),
      });
      setTermTxId(null);
    }
    if (splitTermTxId) {
      fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", id: splitTermTxId }),
      });
      setSplitTermTxId(null);
    }
    setSplitCardStatus(null);
    setGateway("idle");
    setPendingData(null);
    setIsSplit(false);
    toast.info("Pagamento cancelado");
  }

  function finalizeSplitOrder() {
    if (!pendingData) return;
    const orderId = createOrder({
      ...pendingData,
      paymentMethod: "cash",
      splitBill: {
        people: splitSlots.length,
        parts: splitSlots.map((s) => ({
          amount: parseFloat(s.amount.replace(",", ".")) || 0,
          method: s.method,
        })),
      },
    });

    useEstoqueStore.getState().deductForSale(
      items.map((i) => ({ stockLinks: i.product.stockLinks, quantity: i.quantity }))
    );

    const caixa = useCaixaStore.getState();
    if (caixa.isOpen) {
      const order = useFlowStore.getState().orders.find((o) => o.id === orderId);
      const label = order ? `#${order.number}` : "PDV";
      splitSlots.forEach((slot, i) => {
        const amt = parseFloat(slot.amount.replace(",", ".")) || 0;
        if (slot.method === "cash") {
          caixa.addMovement("suprimento", amt, `Venda ${label} — conta dividida parte ${i + 1} (dinheiro)`, true);
        }
      });
    }

    lastOrderIdRef.current = orderId;
    const completedSplitOrder = useFlowStore.getState().orders.find((o) => o.id === orderId);
    if (completedSplitOrder) printOrder(completedSplitOrder);
    toast.success("Pedido enviado para a cozinha!", `R$ ${total.toFixed(2).replace(".", ",")} — conta dividida em ${splitSlots.length} partes`);
    setGateway("idle");
    setPendingData(null);
    setSplitSlots([]);
    setSplitIdx(0);
    setConfirmed(true);
    setTimeout(() => { clearOrder(); setConfirmed(false); }, 6000);
  }

  function confirmSplitSlot() {
    const next = splitIdx + 1;
    if (next >= splitSlots.length) {
      finalizeSplitOrder();
    } else {
      startSplitSlot(next);
    }
  }

  // --- Split bill screens ---
  if (gateway === "split_setup") {
    const n = splitSlots.length;
    const slotTotal = splitSlots.reduce((s, sl) => s + (parseFloat(sl.amount.replace(",", ".")) || 0), 0);
    const diff = total - slotTotal;
    const balanced = Math.abs(diff) < 0.02;

    return (
      <div className="flex flex-col h-full px-4 py-4 gap-3 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">👥</span>
          <div>
            <p className="text-sm font-bold text-neutral-100">Dividir Conta</p>
            <p className="text-xs text-neutral-500">Total: R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        {/* Nº pessoas */}
        <div className="flex items-center justify-between bg-neutral-800 rounded-xl px-4 py-3 shrink-0">
          <span className="text-xs text-neutral-400">Nº de pessoas</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (n > 2) initSplitSlots(n - 1, splitSlots); }}
              disabled={n <= 2}
              className="w-8 h-8 rounded-lg bg-neutral-700 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30"
            >−</button>
            <span className="text-white font-bold text-lg w-5 text-center">{n}</span>
            <button
              onClick={() => { if (n < 8) initSplitSlots(n + 1, splitSlots); }}
              disabled={n >= 8}
              className="w-8 h-8 rounded-lg bg-neutral-700 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30"
            >+</button>
          </div>
        </div>

        {/* Slots */}
        <div className="space-y-2 flex-1">
          {splitSlots.map((slot, i) => (
            <div key={i} className="bg-neutral-800 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-14 shrink-0">Pessoa {i + 1}</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">R$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={slot.amount}
                  onChange={(e) => setSplitSlots(prev => prev.map((s, j) => j === i ? { ...s, amount: e.target.value } : s))}
                  className="w-full pl-7 pr-2 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-sm text-white font-bold text-right outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setSplitSlots(prev => prev.map((s, j) => j === i ? { ...s, method: "cash" } : s))}
                  title="Dinheiro"
                  className={`px-2 py-1.5 rounded-lg text-sm transition-colors ${slot.method === "cash" ? "bg-orange-500 text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                >💵</button>
                <button
                  onClick={() => setSplitSlots(prev => prev.map((s, j) => j === i ? { ...s, method: "card" } : s))}
                  title="Débito"
                  className={`px-2 py-1.5 rounded-lg text-sm transition-colors ${slot.method === "card" ? "bg-blue-600 text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                >💳</button>
              </div>
            </div>
          ))}
        </div>

        {!balanced && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400 text-center shrink-0">
            {diff > 0
              ? `Falta distribuir R$ ${diff.toFixed(2).replace(".", ",")}`
              : `Excesso de R$ ${Math.abs(diff).toFixed(2).replace(".", ",")} — reduza alguma parte`}
          </div>
        )}

        <div className="space-y-2 shrink-0">
          <button
            onClick={() => { startSplitSlot(0); setGateway("split_processing"); }}
            disabled={!balanced}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-colors"
          >
            Processar Pagamentos →
          </button>
          <button onClick={cancelPayment} className="w-full py-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (gateway === "split_processing") {
    const slot = splitSlots[splitIdx];
    if (!slot) return null;
    const slotAmt = parseFloat(slot.amount.replace(",", ".")) || 0;
    const isLast  = splitIdx === splitSlots.length - 1;
    const progress = `Pessoa ${splitIdx + 1} de ${splitSlots.length}`;

    if (slot.method === "card") {
      // Approved
      if (splitCardStatus === "approved") {
        return (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{progress}</p>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <p className="text-green-400 font-black text-xl tracking-widest">APROVADO</p>
            <p className="text-white font-bold">R$ {slotAmt.toFixed(2).replace(".", ",")}</p>
            <button
              onClick={() => { setSplitCardStatus(null); confirmSplitSlot(); }}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors"
            >
              {isLast ? "🖨️ Imprimir e Enviar para Cozinha" : "→ Próxima Pessoa"}
            </button>
          </div>
        );
      }
      // Declined
      if (splitCardStatus === "declined") {
        return (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{progress}</p>
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <span className="text-4xl">✕</span>
            </div>
            <p className="text-red-400 font-black text-xl tracking-widest">RECUSADO</p>
            <p className="text-xs text-neutral-500">Tente novamente</p>
            <button
              onClick={() => startSplitSlot(splitIdx)}
              className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-sm rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
            <button onClick={() => { setSplitCardStatus(null); setGateway("split_setup"); }} className="text-xs text-neutral-600 hover:text-neutral-400">
              ← Voltar
            </button>
          </div>
        );
      }
      // Waiting for terminal (default)
      return (
        <div className="flex flex-col items-center justify-center h-full px-4 gap-5 text-center">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{progress}</p>
          <div className="w-20 h-14 bg-neutral-800 border-2 border-neutral-600 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">💳</span>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-100">Aguardando Maquininha</p>
            <p className="text-xl font-black text-brand-primary mt-1">R$ {slotAmt.toFixed(2).replace(".", ",")}</p>
          </div>
          {terminalUrls.length > 0 && (
            <div className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 space-y-1">
              <p className="text-xs text-neutral-500 font-semibold">📱 Abra no iPhone:</p>
              {terminalUrls.map((url) => (
                <p key={url} className="text-xs font-mono text-orange-400 break-all select-all">{url}</p>
              ))}
            </div>
          )}
          <div className="flex gap-1.5">
            {[0,1,2].map((i) => (
              <span key={i} className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </div>
          <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">
            Cancelar
          </button>
        </div>
      );
    }

    // Cash slot
    const received  = parseFloat(splitCashReceived.replace(",", ".")) || 0;
    const troco     = received - slotAmt;
    const PRESETS   = [slotAmt, Math.ceil(slotAmt / 10) * 10, Math.ceil(slotAmt / 50) * 50, Math.ceil(slotAmt / 100) * 100]
      .filter((v, i, a) => a.indexOf(v) === i && v >= slotAmt)
      .slice(0, 4);

    return (
      <div className="flex flex-col h-full px-4 py-4 gap-4">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">{progress}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-sm font-bold text-neutral-100">Pagamento em Dinheiro</p>
            <p className="text-xs text-neutral-500">R$ {slotAmt.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Valor recebido</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={splitCashReceived}
              onChange={(e) => setSplitCashReceived(e.target.value)}
              placeholder={slotAmt.toFixed(2)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setSplitCashReceived(v.toFixed(2))}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-orange-500/20 hover:text-orange-400 text-neutral-400 transition-all border border-neutral-700"
              >
                {v.toFixed(0)}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center ${troco > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-neutral-800 border border-neutral-700"}`}>
          <p className="text-xs text-neutral-500 mb-1">Troco</p>
          <p className={`text-2xl font-black ${troco > 0 ? "text-green-400" : "text-neutral-600"}`}>
            R$ {troco > 0 ? troco.toFixed(2).replace(".", ",") : "0,00"}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={confirmSplitSlot}
            disabled={splitCashReceived !== "" && received < slotAmt}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-colors"
          >
            {isLast ? "🖨️ Imprimir e Enviar para Cozinha" : "✓ Confirmar → Próxima Pessoa"}
          </button>
          <button onClick={() => setGateway("split_setup")} className="w-full py-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  // --- Payment gateway screens ---
  if (gateway === "awaiting_pix") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-32 h-32 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-2xl flex items-center justify-center">
          <span className="text-5xl">⚡</span>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-100">Aguardando PIX</p>
          <p className="text-xs text-neutral-500 mt-1">R$ {total.toFixed(2).replace(".", ",")} — escaneie o QR code</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0,1,2].map((i) => (
            <span key={i} className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors mt-2">
          Cancelar
        </button>
      </div>
    );
  }

  if (gateway === "awaiting_card") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-5 text-center">
        <div className="w-20 h-14 bg-neutral-800 border-2 border-neutral-600 rounded-2xl flex items-center justify-center">
          <span className="text-4xl">💳</span>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-100">Aguardando Maquininha</p>
          <p className="text-xl font-black text-brand-primary mt-1">
            R$ {total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* URLs do terminal para o iPhone */}
        {terminalUrls.length > 0 && (
          <div className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 space-y-2">
            <p className="text-xs text-neutral-500 font-semibold">📱 Abra no iPhone (mesma rede Wi-Fi):</p>
            {terminalUrls.map((url) => (
              <p key={url} className="text-xs font-mono text-orange-400 break-all select-all">{url}</p>
            ))}
            {terminalUrls.length > 1 && (
              <p className="text-[10px] text-neutral-600">Teste cada URL — use a que abrir</p>
            )}
          </div>
        )}

        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>

        <button onClick={cancelPayment} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">
          Cancelar
        </button>
      </div>
    );
  }

  if (gateway === "approved") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <div>
          <p className="text-green-400 font-bold text-sm">Pagamento Aprovado!</p>
          <p className="text-xs text-neutral-500 mt-1">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>
        <div className="w-full space-y-2">
          <button
            onClick={() => finalizeOrder()}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors"
          >
            🖨️ Imprimir e Enviar para Cozinha
          </button>
          <button onClick={cancelPayment} className="w-full py-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (gateway === "confirming_cash") {
    const received = parseFloat(cashReceived.replace(",", ".")) || 0;
    const troco    = received - total;
    const PRESETS  = [total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100]
      .filter((v, i, a) => a.indexOf(v) === i && v >= total)
      .slice(0, 4);
    return (
      <div className="flex flex-col h-full px-4 py-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-sm font-bold text-neutral-100">Pagamento em Dinheiro</p>
            <p className="text-xs text-neutral-500">Total: R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        {/* Cash received input */}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Valor recebido</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder={total.toFixed(2)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          {/* Presets */}
          <div className="flex gap-2 mt-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setCashReceived(v.toFixed(2))}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-orange-500/20 hover:text-orange-400 text-neutral-400 transition-all border border-neutral-700"
              >
                {v.toFixed(0)}
              </button>
            ))}
          </div>
        </div>

        {/* Troco */}
        <div className={`rounded-xl p-4 text-center ${troco > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-neutral-800 border border-neutral-700"}`}>
          <p className="text-xs text-neutral-500 mb-1">Troco</p>
          <p className={`text-2xl font-black ${troco > 0 ? "text-green-400" : "text-neutral-600"}`}>
            R$ {troco > 0 ? troco.toFixed(2).replace(".", ",") : "0,00"}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={() => finalizeOrder()}
            disabled={received < total && cashReceived !== ""}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-colors"
          >
            🖨️ Imprimir e Enviar para Cozinha
          </button>
          <button onClick={cancelPayment} className="w-full py-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const lastOrder = lastOrderIdRef.current
      ? useFlowStore.getState().orders.find((o) => o.id === lastOrderIdRef.current)
      : null;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <div>
          <p className="text-green-400 font-bold text-sm">Pedido na cozinha!</p>
          <p className="text-neutral-500 text-xs mt-1">Recibo impresso automaticamente</p>
        </div>
        {lastOrder && (
          <button
            onClick={() => printOrder(lastOrder)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm text-neutral-300 font-medium transition-colors"
          >
            🖨️ Reimprimir
          </button>
        )}
      </div>
    );
  }

  // --- Idle state ---
  return (
    <>
      {showModal && (
        <OrderTypeModal onConfirm={handleModalConfirm} onClose={() => setShowModal(false)} />
      )}

      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
          <h2 className="text-sm font-bold text-neutral-100">Resumo</h2>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
          <div className="px-4 py-4 space-y-3">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>

            {/* Linha de desconto */}
            {discount > 0 && !showDiscount && (
              <div className="flex justify-between items-center text-sm text-green-400">
                <button
                  onClick={() => { setShowDiscount(true); setDiscountInput(""); }}
                  className="flex items-center gap-1 hover:text-green-300 transition-colors"
                >
                  <span>Desconto</span>
                  <span className="text-xs text-green-600">✎</span>
                </button>
                <div className="flex items-center gap-2">
                  <span>− R$ {discount.toFixed(2).replace(".", ",")}</span>
                  <button onClick={removeDiscount} className="text-xs text-neutral-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>
            )}

            {/* Painel de edição de desconto */}
            {showDiscount && allowManualDiscount ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 space-y-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setDiscountMode("pct")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${discountMode === "pct" ? "bg-brand-primary text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                  >
                    % Percentual
                  </button>
                  <button
                    onClick={() => setDiscountMode("value")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${discountMode === "value" ? "bg-brand-primary text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}
                  >
                    R$ Valor
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    {discountMode === "pct" ? "%" : "R$"}
                  </span>
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    max={discountMode === "pct" ? 100 : subtotal}
                    step="0.01"
                    placeholder={discountMode === "pct" ? "10" : "5,00"}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyDiscount()}
                    className="w-full pl-8 pr-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-sm text-white font-bold text-right outline-none focus:border-brand-primary/60"
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowDiscount(false)} className="flex-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-700 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button onClick={applyDiscount} className="flex-1 py-1.5 text-xs font-bold bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
                    Aplicar
                  </button>
                </div>
              </div>
            ) : (
              allowManualDiscount && discount === 0 && items.length > 0 && (
                <button
                  onClick={() => setShowDiscount(true)}
                  className="w-full py-1.5 text-xs text-neutral-600 hover:text-neutral-400 border border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg transition-all"
                >
                  + Adicionar desconto
                </button>
              )
            )}

            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              <span className="text-sm font-bold text-neutral-100">Total</span>
              <span className="text-xl font-black text-brand-primary">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="mt-auto px-4 py-4 space-y-2">
            <button
              onClick={() => setShowModal(true)}
              disabled={items.length === 0}
              className="w-full py-4 rounded-lg font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 active:scale-95 text-white shadow-lg shadow-green-900/30"
            >
              Confirmar Pedido
            </button>
            <button
              onClick={() => { setIsSplit(true); setShowModal(true); }}
              disabled={items.length === 0}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 border border-neutral-700 flex items-center justify-center gap-2"
            >
              <span>👥</span> Dividir Conta
            </button>
            <button
              onClick={clearOrder}
              disabled={items.length === 0}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-400/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
