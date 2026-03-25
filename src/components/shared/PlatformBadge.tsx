import { FlowPlatform } from "@/store/useFlowStore";

export const platformConfig: Record<FlowPlatform, { label: string; color: string; bg: string }> = {
  proprio:  { label: "Próprio",  color: "text-brand-primary", bg: "bg-brand-primary/10 border-brand-primary/30" },
  ifood:    { label: "iFood",    color: "text-red-400",        bg: "bg-red-400/10 border-red-400/30" },
  rappi:    { label: "Rappi",    color: "text-orange-400",     bg: "bg-orange-400/10 border-orange-400/30" },
  anota_ai: { label: "Anota AI", color: "text-blue-400",       bg: "bg-blue-400/10 border-blue-400/30" },
  whatsapp: { label: "WhatsApp", color: "text-green-400",      bg: "bg-green-400/10 border-green-400/30" },
};

export function PlatformBadge({ platform }: { platform: FlowPlatform }) {
  const { label, color, bg } = platformConfig[platform];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg}`}>
      {label}
    </span>
  );
}
