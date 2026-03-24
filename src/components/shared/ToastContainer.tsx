"use client";

import { useToastStore, ToastType } from "@/store/useToastStore";

const config: Record<ToastType, { icon: string; bar: string; title: string }> = {
  success: { icon: "✓", bar: "bg-green-500",  title: "text-green-400" },
  error:   { icon: "✕", bar: "bg-red-500",    title: "text-red-400"   },
  warning: { icon: "⚠", bar: "bg-yellow-500", title: "text-yellow-400" },
  info:    { icon: "ℹ", bar: "bg-blue-500",   title: "text-blue-400"  },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const c = config[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden animate-slide-up"
          >
            {/* Color bar */}
            <div className={`w-1 self-stretch shrink-0 ${c.bar}`} />

            {/* Icon */}
            <div className={`mt-3 text-sm font-black shrink-0 ${c.title}`}>
              {c.icon}
            </div>

            {/* Content */}
            <div className="flex-1 py-3 pr-3 min-w-0">
              <p className={`text-sm font-semibold leading-tight ${c.title}`}>
                {t.title}
              </p>
              {t.message && (
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => remove(t.id)}
              className="mt-3 mr-3 text-neutral-600 hover:text-neutral-300 text-xs shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
