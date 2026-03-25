"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { loadGoogleMaps, DARK_MAP_STYLES } from "@/lib/googleMaps";

export interface GoogleMapCardRef {
  updateMotoboy: (progress: number) => void;
}

interface Props {
  customerAddress:       string;
  customerNeighborhood?: string;
  isRiding:              boolean;
  onReady?: (eta: string | null, distance: string | null) => void;
  onError?: () => void;
}

const RESTAURANT = {
  lat: parseFloat(process.env.NEXT_PUBLIC_RESTAURANT_LAT ?? "-22.5233"),
  lng: parseFloat(process.env.NEXT_PUBLIC_RESTAURANT_LNG ?? "-44.1029"),
};

function positionAlongPath(
  path:     google.maps.LatLng[],
  progress: number
): google.maps.LatLng {
  if (!path.length) return new google.maps.LatLng(RESTAURANT.lat, RESTAURANT.lng);
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  const g = (window as any).google.maps.geometry.spherical;
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = g.computeDistanceBetween(path[i - 1], path[i]);
    segLens.push(d);
    total += d;
  }
  const target = progress * total;
  let cum = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (cum + segLens[i] >= target) {
      return g.interpolate(path[i], path[i + 1], (target - cum) / segLens[i]);
    }
    cum += segLens[i];
  }
  return path[path.length - 1];
}

const GoogleMapCard = forwardRef<GoogleMapCardRef, Props>(function GoogleMapCard(
  { customerAddress, customerNeighborhood, isRiding, onReady, onError },
  ref
) {
  const mapRef   = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    map:       any;
    mbMarker:  any;
    routePath: google.maps.LatLng[];
  }>({ map: null, mbMarker: null, routePath: [] });

  useImperativeHandle(ref, () => ({
    updateMotoboy(progress: number) {
      const { map, routePath } = stateRef.current;
      if (!map || !routePath.length || !isRiding) return;
      const pos = positionAlongPath(routePath, progress);
      if (stateRef.current.mbMarker) {
        stateRef.current.mbMarker.setPosition(pos);
      } else {
        stateRef.current.mbMarker = makeMbMarker(map, pos);
      }
    },
  }));

  const init = useCallback(async () => {
    if (!mapRef.current) return;
    try { await loadGoogleMaps(); } catch { onError?.(); return; }

    const g = (window as any).google;

    const map = new g.maps.Map(mapRef.current, {
      center:           RESTAURANT,
      zoom:             16,
      styles:           DARK_MAP_STYLES,
      disableDefaultUI: true,
      gestureHandling:  "none",
    });
    stateRef.current.map = map;

    // Restaurant marker
    makeRestaurantMarker(map, RESTAURANT);

    // Geocode customer
    const geocoder = new g.maps.Geocoder();
    const addr = [customerAddress, customerNeighborhood, "Brasil"].filter(Boolean).join(", ");

    geocoder.geocode({ address: addr }, (results: any, status: string) => {
      if (status !== "OK" || !results?.[0]) { onError?.(); return; }
      const dest = results[0].geometry.location;

      // Customer marker (pulsing blue circle like GPS)
      makePulseMarker(map, dest);

      // Route
      new g.maps.DirectionsService().route(
        { origin: RESTAURANT, destination: dest, travelMode: g.maps.TravelMode.DRIVING },
        (result: any, dirStatus: string) => {
          if (dirStatus !== "OK") { onError?.(); return; }

          // Solid red route
          const solidRenderer = new g.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4, strokeOpacity: 0.9 },
          });
          solidRenderer.setDirections(result);
          solidRenderer.setMap(map);

          // Dashed white overlay
          const dashedRenderer = new g.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#ffffff",
              strokeWeight: 2,
              strokeOpacity: 0,
              icons: [{
                icon: { path: "M 0,-1 0,1", strokeOpacity: 0.6, strokeWeight: 2, scale: 3 },
                offset: "0",
                repeat: "15px",
              }],
            },
          });
          dashedRenderer.setDirections(result);
          dashedRenderer.setMap(map);

          const leg  = result.routes[0].legs[0];
          const path = result.routes[0].overview_path as google.maps.LatLng[];
          stateRef.current.routePath = path;

          if (isRiding) {
            stateRef.current.mbMarker = makeMbMarker(map, path[0]);
          }

          const bounds = new g.maps.LatLngBounds();
          bounds.extend(RESTAURANT);
          bounds.extend(dest);
          map.fitBounds(bounds, { top: 60, right: 30, bottom: 30, left: 30 });
          g.maps.event.addListenerOnce(map, "idle", () => {
            map.setZoom(Math.min((map.getZoom() ?? 14) + 2, 18));
          });

          onReady?.(leg.duration.text, leg.distance.text);
        }
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerAddress, customerNeighborhood]);

  useEffect(() => { init(); }, [init]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
});

export default GoogleMapCard;

/* ── Marker helpers ── */

/** Orange teardrop pin with a fork-and-knife silhouette — restaurant */
function makeRestaurantMarker(map: any, pos: any) {
  const g = (window as any).google;
  // Teardrop shape: circle top, triangle point bottom
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">',
    '<path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32S40 34 40 20C40 9 31 0 20 0z" fill="#DC2626"/>',
    '<path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32S40 34 40 20C40 9 31 0 20 0z" fill="none" stroke="white" stroke-width="2"/>',
    // Fork (left)
    '<line x1="14" y1="10" x2="14" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="11" y1="10" x2="11" y2="15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="17" y1="10" x2="17" y2="15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="11" y1="15" x2="17" y2="15" stroke="white" stroke-width="1.5"/>',
    // Knife (right)
    '<line x1="26" y1="10" x2="26" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M26 10 Q30 13 26 17" fill="white"/>',
    '</svg>',
  ].join("");
  return new g.maps.Marker({
    map, position: pos, zIndex: 8,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new g.maps.Size(40, 52),
      anchor:     new g.maps.Point(20, 52),
    },
  });
}

/** Blue GPS dot with accuracy rings — customer location */
function makePulseMarker(map: any, pos: any) {
  const g = (window as any).google;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">',
    '<circle cx="28" cy="28" r="26" fill="#3b82f6" fill-opacity="0.15"/>',
    '<circle cx="28" cy="28" r="18" fill="#3b82f6" fill-opacity="0.25"/>',
    '<circle cx="28" cy="28" r="11" fill="#3b82f6" stroke="white" stroke-width="3"/>',
    '<circle cx="28" cy="28" r="4" fill="white"/>',
    '</svg>',
  ].join("");
  return new g.maps.Marker({
    map, position: pos, zIndex: 5,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new g.maps.Size(56, 56),
      anchor:     new g.maps.Point(28, 28),
    },
  });
}

/** Red circle with a motorcycle silhouette — motoboy */
function makeMbMarker(map: any, pos: any) {
  const g = (window as any).google;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">',
    '<circle cx="24" cy="24" r="22" fill="#DC2626" stroke="white" stroke-width="2.5"/>',
    // Rear wheel (larger)
    '<circle cx="13" cy="32" r="7" fill="none" stroke="white" stroke-width="2"/>',
    '<circle cx="13" cy="32" r="2.5" fill="white"/>',
    // Front wheel (smaller)
    '<circle cx="36" cy="32" r="5" fill="none" stroke="white" stroke-width="2"/>',
    '<circle cx="36" cy="32" r="1.8" fill="white"/>',
    // Engine/body block
    '<path d="M13 32 L19 22 L28 22 L36 32" fill="none" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>',
    '<rect x="19" y="22" width="9" height="5" rx="2" fill="white" fill-opacity="0.55"/>',
    // Front fork
    '<path d="M30 22 L34 27 L36 32" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>',
    // Handlebar
    '<line x1="27" y1="20" x2="33" y2="20" stroke="white" stroke-width="2" stroke-linecap="round"/>',
    // Seat/tank
    '<path d="M19 22 C19 18 28 18 28 22" fill="white" fill-opacity="0.65"/>',
    // Rider head (helmet)
    '<circle cx="22" cy="15" r="3.5" fill="white"/>',
    '<path d="M19 15 Q19 19 22 19 Q25 19 25 15" fill="white" fill-opacity="0.4"/>',
    '</svg>',
  ].join("");
  return new g.maps.Marker({
    map, position: pos, zIndex: 10,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new g.maps.Size(48, 48),
      anchor:     new g.maps.Point(24, 24),
    },
  });
}
