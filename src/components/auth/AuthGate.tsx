"use client";

import { useAuthStore } from "@/store/useAuthStore";
import LoginScreen from "./LoginScreen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const operator = useAuthStore((s) => s.operator);
  if (!operator) return <LoginScreen />;
  return <>{children}</>;
}
