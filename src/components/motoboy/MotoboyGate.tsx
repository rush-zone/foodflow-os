"use client";

import { useMotoboysAuthStore } from "@/store/useMotoboysAuthStore";
import MotoboyLogin from "./MotoboyLogin";
import MotoboyPortal from "./MotoboyPortal";

export default function MotoboyGate() {
  const currentMotoboy = useMotoboysAuthStore((s) => s.currentMotoboy);
  if (!currentMotoboy) return <MotoboyLogin />;
  return <MotoboyPortal />;
}
