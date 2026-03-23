"use client";

import { useEffect } from "react";

interface WhatsAppToastProps {
  customer: string;
  message: string;
  onClose: () => void;
}

export default function WhatsAppToast({ customer, message, onClose }: WhatsAppToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-16 right-4 z-50 w-80 bg-neutral-800 border border-green-500/40 rounded-2xl shadow-card overflow-hidden animate-slide-in">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-600">
        <span className="text-white text-sm">💬</span>
        <span className="text-white text-xs font-bold">WhatsApp enviado</span>
        <button onClick={onClose} className="ml-auto text-white/60 hover:text-white text-xs">✕</button>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-neutral-300 mb-1">Para: {customer}</p>
        <p className="text-xs text-neutral-400 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
