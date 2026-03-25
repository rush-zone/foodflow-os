"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, canAccess, ROLE_HOME, ROLE_LABEL } from "@/store/useAuthStore";
import AppNav from "@/components/shared/AppNav";
import LoginScreen from "@/components/auth/LoginScreen";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const operator  = useAuthStore((s) => s.operator);
  const logout    = useAuthStore((s) => s.logout);

  const isPublic = pathname.startsWith("/motoboy") || pathname.startsWith("/loja");
  const role     = operator?.role;

  // Redireciona cozinha para /kds se tentar acessar outra rota
  useEffect(() => {
    if (role === "cozinha" && pathname !== "/kds") {
      router.replace("/kds");
    }
  }, [role, pathname, router]);

  // ── Rotas públicas — sem nav e sem autenticação ──
  if (isPublic) return <>{children}</>;

  // ── Sem operador → tela de login ──
  if (!operator || !role) return <LoginScreen />;

  // ── Cozinha aguardando redirect ──
  if (role === "cozinha" && pathname !== "/kds") return null;

  // ── Acesso negado ──
  if (!canAccess(role, pathname)) {
    return (
      <div className="flex flex-col h-full bg-neutral-900">
        <AppNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
          <span className="text-6xl">🔒</span>
          <div>
            <p className="text-white font-black text-xl">Acesso restrito</p>
            <p className="text-neutral-500 text-sm mt-2 max-w-xs">
              O cargo{" "}
              <span className="text-white font-semibold">{ROLE_LABEL[role]}</span>{" "}
              não tem permissão para acessar esta área.
            </p>
          </div>
          <button
            onClick={() => router.replace(ROLE_HOME[role])}
            className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-colors text-sm"
          >
            Ir para minha tela
          </button>
          <button
            onClick={logout}
            className="text-xs text-neutral-600 hover:text-red-400 transition-colors"
          >
            Trocar operador
          </button>
        </div>
      </div>
    );
  }

  // ── Layout normal ──
  return (
    <>
      <AppNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </>
  );
}
