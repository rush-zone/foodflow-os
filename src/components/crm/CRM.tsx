"use client";

import { useCRMStore } from "@/store/useCRMStore";
import ContactList from "./ContactList";
import ChatWindow from "./ChatWindow";
import CustomerProfile from "./CustomerProfile";

export default function CRM() {
  const customers = useCRMStore((s) => s.customers);
  const totalUnread = customers.reduce((s, c) => s + c.unread, 0);
  const inactiveCount = customers.filter((c) => c.tags.includes("inativo")).length;
  const vipCount = customers.filter((c) => c.tags.includes("vip")).length;

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">FF</div>
          <div>
            <span className="font-bold text-white text-sm">FoodFlow OS</span>
            <span className="ml-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              💬 CRM WhatsApp
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm">
          {[
            { label: "Não lidas",  value: totalUnread,  color: totalUnread > 0 ? "text-green-400" : "text-neutral-500" },
            { label: "VIP",        value: vipCount,     color: "text-yellow-400" },
            { label: "Inativos",   value: inactiveCount,color: "text-neutral-400" },
            { label: "Contatos",   value: customers.length, color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`font-bold ${s.color}`}>{s.value}</span>
              <span className="text-neutral-500 text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Body — 3 columns */}
      <div className="flex flex-1 overflow-hidden divide-x divide-neutral-800">
        {/* Contacts */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <ContactList />
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow />
        </div>

        {/* Profile */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <CustomerProfile />
        </div>
      </div>
    </div>
  );
}
