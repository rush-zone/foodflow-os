export function HelmetIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Helmet dome */}
      <path d="M12 2C7.2 2 3.5 6.1 3.5 11.5V13h17v-1.5C20.5 6.1 16.8 2 12 2z" />
      {/* Chin bar */}
      <path d="M3.5 13v2.2C3.5 16.75 4.75 18 6.3 18h11.4c1.55 0 2.8-1.25 2.8-2.8V13H3.5z" />
      {/* Visor / face shield */}
      <rect x="6.5" y="10" width="11" height="3.5" rx="1.5" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}
