// Singleton loader — loads the Maps JS API only once per page session
let _promise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // Already loaded
  if ((window as any).google?.maps?.Map) return Promise.resolve();
  // Already loading
  if (_promise) return _promise;

  _promise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) { reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set")); return; }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload  = () => resolve();
    script.onerror = () => { _promise = null; reject(new Error("Maps load failed")); };
    document.head.appendChild(script);
  });

  return _promise;
}

// Light gray map styles (neutral / silver)
export const DARK_MAP_STYLES: object[] = [
  { elementType: "geometry",              stylers: [{ color: "#efefef" }] },
  { elementType: "labels.icon",           stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",      stylers: [{ color: "#6b7280" }] },
  { elementType: "labels.text.stroke",    stylers: [{ color: "#ffffff" }] },
  { featureType: "road",                  elementType: "geometry",            stylers: [{ color: "#ffffff" }] },
  { featureType: "road",                  elementType: "geometry.stroke",     stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road",                  elementType: "labels.text.fill",    stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.highway",          elementType: "geometry",            stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.highway",          elementType: "labels.text.fill",    stylers: [{ color: "#6b7280" }] },
  { featureType: "water",                 elementType: "geometry",            stylers: [{ color: "#bfdbfe" }] },
  { featureType: "water",                 elementType: "labels.text.fill",    stylers: [{ color: "#93c5fd" }] },
  { featureType: "poi",                   stylers: [{ visibility: "off" }] },
  { featureType: "transit",               stylers: [{ visibility: "off" }] },
  { featureType: "landscape",             elementType: "geometry",            stylers: [{ color: "#f3f4f6" }] },
  { featureType: "administrative",        elementType: "geometry.stroke",     stylers: [{ color: "#d1d5db" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
];
