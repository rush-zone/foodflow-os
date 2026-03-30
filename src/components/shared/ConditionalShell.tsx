"use client";

import { usePathname } from "next/navigation";
import LayoutShell from "@/components/shared/LayoutShell";

// Routes that are customer/public-facing — no operator auth, no AppNav
const PUBLIC_PREFIXES = ["/loja", "/motoboy", "/terminal"];

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        {children}
      </div>
    );
  }

  return <LayoutShell>{children}</LayoutShell>;
}
