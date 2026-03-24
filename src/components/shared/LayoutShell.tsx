"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import AppNav from "@/components/shared/AppNav";
import LoginScreen from "@/components/auth/LoginScreen";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const operator = useAuthStore((s) => s.operator);

  // Rotas públicas: sem nav e sem autenticação de operador
  if (pathname.startsWith("/motoboy") || pathname.startsWith("/loja")) return <>{children}</>;

  // Autenticação de operador
  if (!operator) return <LoginScreen />;

  return (
    <>
      <AppNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </>
  );
}
