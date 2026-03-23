"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFlowStore, FlowOrder } from "@/store/useFlowStore";

// ─── constants ────────────────────────────────────────────────────────────────

// Restaurant base — Vila Madalena, São Paulo
const RESTAURANT: [number, number] = [-23.5513, -46.6813];

// Approximate coords per neighborhood
const HOOD_COORDS: Record<string, [number, number]> = {
  "Vila Madalena": [-23.5490, -46.6910],
  "Pinheiros":     [-23.5669, -46.6828],
  "Bela Vista":    [-23.5632, -46.6543],
  "Jardins":       [-23.5718, -46.6631],
  "Itaim Bibi":    [-23.5843, -46.6726],
  "Moema":         [-23.6003, -46.6706],
  "Consolação":    [-23.5567, -46.6569],
  "Liberdade":     [-23.5597, -46.6384],
};

// Initial positions — m1 already out delivering, m2/m3 at restaurant
const MOTOBOY_INIT: Record<string, [number, number]> = {
  m1: [-23.5498, -46.6856],
  m2: [-23.5513, -46.6813],
  m3: [-23.5515, -46.6820],
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPos(a: [number, number], b: [number, number], t: number): [number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function jitter(pos: [number, number], amount = 0.0004): [number, number] {
  return [
    pos[0] + (Math.random() - 0.5) * amount,
    pos[1] + (Math.random() - 0.5) * amount,
  ];
}

function destFor(order: FlowOrder): [number, number] {
  if (order.neighborhood && HOOD_COORDS[order.neighborhood]) {
    return HOOD_COORDS[order.neighborhood];
  }
  // fallback: slight offset from restaurant
  return [RESTAURANT[0] - 0.01, RESTAURANT[1] + 0.008];
}

// ─── custom icons ─────────────────────────────────────────────────────────────

function motoboyIcon(name: string, online: boolean) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = online ? "#FF5A1F" : "#374151";
  const border = online ? "#FF8C42" : "#4B5563";
  return L.divIcon({
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${bg};border:2px solid ${border};
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:11px;
        box-shadow:0 2px 8px rgba(0,0,0,0.6);
        font-family:Inter,sans-serif;
      ">${initials}</div>
    `,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function restaurantIcon() {
  return L.divIcon({
    html: `
      <div style="
        width:40px;height:40px;border-radius:10px;
        background:#1c1c1c;border:2px solid #FF5A1F;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;box-shadow:0 2px 12px rgba(255,90,31,0.4);
      ">🍔</div>
    `,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

function destIcon(status: string) {
  const color = status === "on_the_way" ? "#22C55E" : "#6B7280";
  return L.divIcon({
    html: `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${color}22;border:2px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.5);
      ">📍</div>
    `,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// ─── recenter helper ──────────────────────────────────────────────────────────

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo(center, 14, { duration: 1 })}
      className="absolute bottom-3 right-3 z-[1000] bg-neutral-800 border border-neutral-600 text-neutral-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
    >
      Centralizar
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function DeliveryMap() {
  const orders    = useFlowStore((s) => s.orders);
  const motoboys  = useFlowStore((s) => s.motoboys);
  const available = useFlowStore((s) => s.availableMotoboys);

  // positions keyed by motoboy id
  const [positions, setPositions] = useState<Record<string, [number, number]>>(
    Object.fromEntries(motoboys.map((m) => [m.id, MOTOBOY_INIT[m.id] ?? RESTAURANT]))
  );

  // progress of each active delivery [0-1]
  const progressRef = useRef<Record<string, number>>(
    Object.fromEntries(motoboys.map((m) => [m.id, m.id === "m1" ? 0.3 : 0]))
  );

  // active delivery orders (on_the_way)
  const activeDeliveries = orders.filter(
    (o) => o.type === "delivery" && o.status === "on_the_way" && o.motoboy
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const prog = progressRef.current;

      setPositions((prev) => {
        const next = { ...prev };

        motoboys.forEach((m) => {
          const order = activeDeliveries.find((o) => o.motoboy?.id === m.id);
          if (order) {
            // Move toward destination
            const dest = destFor(order);
            const t = Math.min((prog[m.id] ?? 0) + 0.018, 1);
            prog[m.id] = t;
            const interpolated = lerpPos(RESTAURANT, dest, t);
            next[m.id] = jitter(interpolated, 0.0003);
          } else if (!available.has(m.id)) {
            // Busy but not on_the_way — slight idle jitter at restaurant
            next[m.id] = jitter(RESTAURANT, 0.0002);
          }
          // available motoboys: tiny idle movement at restaurant
          else {
            next[m.id] = jitter(RESTAURANT, 0.00015);
          }
        });

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [motoboys, activeDeliveries, available]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={RESTAURANT}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        {/* Dark CartoDB tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {/* Restaurant marker */}
        <Marker position={RESTAURANT} icon={restaurantIcon()}>
          <Popup className="leaflet-dark-popup">
            <div className="text-xs font-bold">🍔 Restaurante</div>
            <div className="text-xs text-neutral-400">Vila Madalena, SP</div>
          </Popup>
        </Marker>

        {/* Destination markers for active deliveries */}
        {activeDeliveries.map((order) => {
          const dest = destFor(order);
          return (
            <Marker key={`dest-${order.id}`} position={dest} icon={destIcon(order.status)}>
              <Popup>
                <div className="text-xs font-bold">#{order.number} — {order.customer}</div>
                <div className="text-xs text-neutral-400">{order.address}</div>
                <div className="text-xs text-neutral-400">{order.neighborhood}</div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route lines for active deliveries */}
        {activeDeliveries.map((order) => {
          const dest = destFor(order);
          const mbPos = order.motoboy ? positions[order.motoboy.id] : null;
          if (!mbPos) return null;
          return (
            <Polyline
              key={`route-${order.id}`}
              positions={[RESTAURANT, mbPos, dest]}
              pathOptions={{ color: "#FF5A1F", weight: 2, opacity: 0.5, dashArray: "6 4" }}
            />
          );
        })}

        {/* Motoboy markers */}
        {motoboys.map((m) => {
          const pos = positions[m.id];
          if (!pos) return null;
          const isOnline = !available.has(m.id) || activeDeliveries.some((o) => o.motoboy?.id === m.id);
          const activeOrder = activeDeliveries.find((o) => o.motoboy?.id === m.id);
          return (
            <Marker key={m.id} position={pos} icon={motoboyIcon(m.name, isOnline)}>
              <Popup>
                <div className="text-xs font-bold">{m.name}</div>
                <div className="text-xs text-neutral-400">{m.vehicle} · {m.plate}</div>
                {activeOrder ? (
                  <div className="text-xs text-green-400 mt-1">
                    🏍️ Entregando #{activeOrder.number} para {activeOrder.customer}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 mt-1">Disponível</div>
                )}
              </Popup>
            </Marker>
          );
        })}

        <RecenterButton center={RESTAURANT} />
      </MapContainer>

      {/* Live badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-200 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Monitoramento ao vivo
      </div>

      {/* Motoboy legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-neutral-900/90 border border-neutral-700 rounded-xl px-3 py-2 backdrop-blur-sm space-y-1.5">
        {motoboys.map((m) => {
          const activeOrder = activeDeliveries.find((o) => o.motoboy?.id === m.id);
          const isAvailable = available.has(m.id);
          return (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: activeOrder ? "#FF5A1F" : isAvailable ? "#22C55E" : "#6B7280" }}
              />
              <span className="text-neutral-200 font-medium">{m.name.split(" ")[0]}</span>
              <span className="text-neutral-500">
                {activeOrder ? `#${activeOrder.number}` : isAvailable ? "livre" : "ocupado"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
