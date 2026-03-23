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
        return (
          <Link
            key={route.href}
            href={route.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all relative ${
              active
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <span className="text-base">{route.icon}</span>
            <span className="hidden sm:block">{route.label}</span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
