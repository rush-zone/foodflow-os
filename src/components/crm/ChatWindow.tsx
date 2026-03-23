"use client";

import { useState, useRef, useEffect } from "react";
import { useCRMStore } from "@/store/useCRMStore";

const statusIcon: Record<string, string> = {
  sent:      "✓",
  delivered: "✓✓",
  read:      "✓✓",
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow() {
  const customers = useCRMStore((s) => s.customers);
  const selectedId = useCRMStore((s) => s.selectedId);
  const sendMessage = useCRMStore((s) => s.sendMessage);
  const templates = useCRMStore((s) => s.templates);

  const customer = customers.find((c) => c.id === selectedId);
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [customer?.messages.length]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600">
        <span className="text-4xl mb-2">💬</span>
        <p className="text-sm">Selecione um cliente</p>
      </div>
    );
  }

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || !selectedId) return;
    sendMessage(selectedId, msg);
    setInput("");
    setShowTemplates(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-800 shrink-0 bg-neutral-800/30">
        <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-300 shrink-0">
          {customer.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-100">{customer.name}</p>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {customer.phone}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {customer.totalOrders} pedidos · R$ {customer.totalSpent.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-2"
        style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 1px)", backgroundSize: "20px 20px", backgroundOpacity: "0.3" }}
      >
        {customer.messages.map((msg, i) => {
          const isRestaurant = msg.from === "restaurant";
          const prevMsg = customer.messages[i - 1];
          const showDate = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-3 py-1 rounded-full">
                    {msg.timestamp.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              )}
              <div className={`flex ${isRestaurant ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm relative group ${
                  isRestaurant
                    ? "bg-green-600 text-white rounded-br-sm"
                    : "bg-neutral-700 text-neutral-100 rounded-bl-sm"
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isRestaurant ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                    {isRestaurant && (
                      <span className={`text-xs ${msg.status === "read" ? "text-blue-300" : "opacity-60"}`}>
                        {statusIcon[msg.status]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="border-t border-neutral-800 px-4 py-3 bg-neutral-800/50 shrink-0">
          <p className="text-xs text-neutral-500 mb-2">Respostas rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSend(t.text)}
                className="text-left bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-xl px-3 py-2 text-xs transition-colors"
              >
                <span className="mr-1">{t.emoji}</span>
                <span className="font-medium text-neutral-200">{t.label}</span>
                <p className="text-neutral-500 mt-0.5 line-clamp-1">{t.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-neutral-800 shrink-0">
        <button
          onClick={() => setShowTemplates((v) => !v)}
          className={`text-xl transition-colors shrink-0 ${showTemplates ? "text-brand-primary" : "text-neutral-500 hover:text-neutral-300"}`}
          title="Respostas rápidas"
        >
          ⚡
        </button>
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/50 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="w-10 h-10 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
