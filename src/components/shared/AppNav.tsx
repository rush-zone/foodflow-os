"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFlowStore } from "@/store/useFlowStore";
import { useCRMStore } from "@/store/useCRMStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useConfigStore, PLAN_LABELS } from "@/store/useConfigStore";

const routes = [
  { href: "/",           label: "PDV",      icon: "🖥️" },
  { href: "/kds",        label: "Cozinha",  icon: "🍳" },
  { href: "/delivery",   label: "Delivery", icon: "🏍️" },
  { href: "/hub",        label: "Pedidos",  icon: "📋" },
  { href: "/estoque",    label: "Estoque",  icon: "📦" },
  { href: "/analytics",  label: "BI",       icon: "📊" },
  { href: "/crm",        label: "CRM",      icon: "💬" },
  { href: "/multiunit",  label: "Rede",     icon: "🏢" },
  { href: "/cardapio",   label: "Cardápio", icon: "🍽️" },
  { href: "/caixa",         label: "Caixa",    icon: "💰" },
  { href: "/configuracoes", label: "Config",    icon: "⚙️" },
  { href: "/loja",          label: "FlowStore", icon: "🛍️" },
];

export default function AppNav() {
  const pathname  = usePathname();
  const orders    = useFlowStore((s) => s.orders);
  const customers = useCRMStore((s) => s.customers);
  const operator  = useAuthStore((s) => s.operator);
  const logout    = useAuthStore((s) => s.logout);
  const plan      = useConfigStore((s) => s.plan);

  const pendingKDS = orders.filter((o) => o.status === "pending").length;
  const unreadCRM  = customers.reduce((sum, c) => sum + c.unread, 0);

  const badges: Record<string, number> = {
    "/kds": pendingKDS,
    "/crm": unreadCRM,
  };

  return (
    <nav className="flex items-center gap-1 px-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-4 border-r border-neutral-800 mr-2 py-2">
        <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">
          FF
        </div>
        <span className="text-sm font-bold text-white hidden xl:block">FoodFlow</span>
      </div>

      {routes.map((route) => {
        const active = pathname === route.href;
        const badge  = badges[route.href] ?? 0;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all relative ${
              active ? "text-white" : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <span className="relative text-base">
              {route.icon}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span className="hidden sm:block">{route.label}</span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
            )}
          </Link>
        );
      })}

      {/* Spacer + operator */}
      <div className="ml-auto flex items-center gap-2 pl-4 border-l border-neutral-800">
        <span className={`hidden md:inline text-[10px] font-bold px-2 py-0.5 rounded-full ${
          plan === "enterprise" ? "bg-purple-500/20 text-purple-400" :
          plan === "growth"     ? "bg-brand-primary/20 text-brand-primary" :
          plan === "pro"        ? "bg-blue-500/20 text-blue-400" :
                                  "bg-neutral-700 text-neutral-400"
        }`}>
          {PLAN_LABELS[plan]}
        </span>
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-medium text-white leading-none">{operator}</span>
          <span className="text-[10px] text-neutral-500">operador</span>
        </div>
        <button
          onClick={logout}
          title="Sair"
          className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 flex items-center justify-center transition-all text-sm"
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}
