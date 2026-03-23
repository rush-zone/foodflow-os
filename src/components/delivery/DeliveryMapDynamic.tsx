"use client";

import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-xl border border-neutral-800">
      <div className="flex flex-col items-center gap-3 text-neutral-600">
        <span className="text-3xl">🗺️</span>
        <p className="text-xs">Carregando mapa...</p>
      </div>
    </div>
  ),
});

export default DeliveryMap;
