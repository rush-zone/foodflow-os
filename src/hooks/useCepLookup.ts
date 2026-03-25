import { useState } from "react";

export interface CepResult {
  logradouro: string;
  bairro:     string;
  localidade: string;
  uf:         string;
}

interface Options {
  onFill: (data: CepResult) => void;
}

export function useCepLookup({ onFill }: Options) {
  const [cep, setCep]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  async function lookup(digits: string) {
    setLoading(true);
    setError(false);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { setError(true); return; }
      onFill(data as CepResult);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    setCep(digits);
    setError(false);
    if (digits.length === 8) lookup(digits);
  }

  // Display format: 01310-100
  const formatted = cep.length > 5
    ? `${cep.slice(0, 5)}-${cep.slice(5)}`
    : cep;

  return { cep, formatted, loading, error, handleChange };
}
