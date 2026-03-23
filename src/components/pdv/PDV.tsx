"use client";

import CatalogPanel from "./CatalogPanel";
import OrderPanel from "./OrderPanel";
import PaymentPanel from "./PaymentPanel";
import Header from "./Header";

export default function PDV() {
  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Catalog */}
        <div className="w-[55%] border-r border-neutral-800 flex flex-col overflow-hidden">
          <CatalogPanel />
        </div>

        {/* CENTER — Order */}
        <div className="w-[25%] border-r border-neutral-800 flex flex-col overflow-hidden">
          <OrderPanel />
        </div>

        {/* RIGHT — Payment */}
        <div className="w-[20%] flex flex-col overflow-hidden">
          <PaymentPanel />
        </div>
      </div>
    </div>
  );
}
