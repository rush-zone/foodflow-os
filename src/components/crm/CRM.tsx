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
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-end px-6 py-2 border-b border-neutral-800 shrink-0">
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
