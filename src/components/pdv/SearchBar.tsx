"use client";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
        🔍
      </span>
      <input
        type="text"
        placeholder="Buscar produto..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
