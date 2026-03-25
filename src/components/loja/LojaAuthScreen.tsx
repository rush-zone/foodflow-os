"use client";

import { useState } from "react";
import { useLojaCustomerStore } from "@/store/useLojaCustomerStore";

const inputCls =
  "w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all";
const inputErrCls =
  "w-full bg-red-50 border border-red-300 rounded-2xl px-4 py-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";

const ERROR_MSG: Record<string, string> = {
  email_taken:         "Este e-mail já está cadastrado.",
  phone_taken:         "Este telefone já está cadastrado.",
  invalid_credentials: "Senha incorreta.",
  user_not_found:      "Nenhuma conta encontrada.",
};

type Mode = "login" | "register";

export default function LojaAuthScreen() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col overflow-auto">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary shrink-0" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-primary/30">
              FF
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-neutral-900">FoodFlow</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {mode === "login" ? "Entre para fazer seu pedido" : "Crie sua conta gratuitamente"}
              </p>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-neutral-100 rounded-2xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-lg p-6">
            {mode === "login" ? (
              <LoginForm onSwitchToRegister={() => setMode("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setMode("login")} />
            )}
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6">
            Seus dados estão seguros e nunca serão compartilhados.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── LOGIN ── */
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const login = useLojaCustomerStore((s) => s.login);

  const [credential, setCredential] = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!credential.trim() || !password || loading) return;
    setLoading(true);
    setTimeout(() => {
      const r = login(credential.trim(), password);
      if (!r.ok) setError(ERROR_MSG[r.error] ?? "Erro ao entrar.");
      setLoading(false);
    }, 400);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
          E-mail ou telefone
        </label>
        <input
          placeholder="seu@email.com ou (21) 9..."
          value={credential}
          onChange={(e) => { setCredential(e.target.value); setError(null); }}
          autoComplete="username"
          className={error ? inputErrCls : inputCls}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
          Senha
        </label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            autoComplete="current-password"
            className={`${error ? inputErrCls : inputCls} pr-12`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-sm select-none"
          >
            {showPwd ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!credential.trim() || !password || loading}
        className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 mt-2"
      >
        {loading ? "Entrando..." : "Entrar →"}
      </button>

      <p className="text-center text-xs text-neutral-500 pt-1">
        Não tem conta?{" "}
        <button type="button" onClick={onSwitchToRegister} className="text-brand-primary hover:text-brand-secondary font-bold transition-colors">
          Criar conta
        </button>
      </p>
    </form>
  );
}

/* ─────────────────────────── REGISTER ── */
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const register = useLojaCustomerStore((s) => s.register);

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk  = phone.trim().replace(/\D/g, "").length >= 8;
  const pwdOk    = password.length >= 6;
  const pwdMatch = password === confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!name.trim() || !emailOk || !phoneOk || !pwdOk || !pwdMatch || loading) return;
    setLoading(true);
    setTimeout(() => {
      const r = register({ name, email, phone, password });
      if (!r.ok) { setError(ERROR_MSG[r.error] ?? "Erro ao criar conta."); setLoading(false); }
    }, 400);
  }

  const f = (ok: boolean) => submitted && !ok ? inputErrCls : inputCls;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <input placeholder="Nome completo *" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={f(!!name.trim())} />
      <input placeholder="E-mail *" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} autoComplete="email" className={f(emailOk)} />
      <input placeholder="WhatsApp * — (21) 9..." value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} inputMode="tel" autoComplete="tel" className={f(phoneOk)} />

      <div className="relative">
        <input
          type={showPwd ? "text" : "password"}
          placeholder="Senha (mín. 6 caracteres) *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={`${f(pwdOk)} pr-12`}
        />
        <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-sm select-none">
          {showPwd ? "🙈" : "👁️"}
        </button>
      </div>

      <input type={showPwd ? "text" : "password"} placeholder="Confirmar senha *" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={f(!submitted || pwdMatch)} />
      {submitted && !pwdMatch && <p className="text-xs text-red-500 -mt-1 px-1">As senhas não coincidem</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 mt-1"
      >
        {loading ? "Criando conta..." : "Criar conta e entrar →"}
      </button>

      <p className="text-center text-xs text-neutral-500 pt-1">
        Já tem conta?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-brand-primary hover:text-brand-secondary font-bold transition-colors">
          Entrar
        </button>
      </p>
    </form>
  );
}
