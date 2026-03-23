"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/",          label: "PDV",      icon: "🖥️" },
  { href: "/kds",       label: "Cozinha",  icon: "🍳" },
  { href: "/delivery",  label: "Delivery", icon: "🏍️" },
  { href: "/hub",       label: "Pedidos",  icon: "📋" },
  { href: "/estoque",   label: "Estoque",  icon: "📦" },
  { href: "/analytics", label: "BI",       icon: "📊" },
  { href: "/crm",       label: "CRM",      icon: "💬" },
  { href: "/multiunit", label: "Rede",     icon: "🏢" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-neutral-800/90 backdrop-blur border border-neutral-700 rounded-2xl px-3 py-2 shadow-card">
      {routes.map((route) => {
        const active = pathname === route.href;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-brand-primary text-white shadow-lg"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
            }`}
          >
            <span>{route.icon}</span>
            <span>{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
