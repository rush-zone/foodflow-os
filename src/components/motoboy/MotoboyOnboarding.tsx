"use client";

import { useEffect, useRef, useState } from "react";
import { useMotoboysAuthStore } from "@/store/useMotoboysAuthStore";
import { useFlowStore } from "@/store/useFlowStore";

// ─── helpers ─────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ["Moto", "Bicicleta"];

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <=  2) return d;
  if (d.length <=  6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputCls =
  "w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/60 transition-colors";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? "w-5 bg-orange-500" : i === current ? "w-8 bg-orange-500" : "w-1.5 bg-neutral-700"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Camera capture component ─────────────────────────────────────────────────

function CameraCapture({
  onCapture,
  onSkip,
}: {
  onCapture: (base64: string) => void;
  onSkip:    () => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [phase,    setPhase]    = useState<"init" | "live" | "preview" | "error">("init");
  const [photo,    setPhoto]    = useState("");
  const [errMsg,   setErrMsg]   = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("live");
    } catch {
      setPhase("error");
      setErrMsg("Câmera não encontrada ou permissão negada. Use o upload manual abaixo.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Countdown then capture
  function beginCapture() {
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n--;
      if (n > 0) {
        setCountdown(n);
      } else {
        clearInterval(id);
        setCountdown(null);
        captureFrame();
      }
    }, 1000);
  }

  function captureFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the frame (selfie feel)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setPhoto(dataUrl);
    stopCamera();
    setPhase("preview");
  }

  function retake() {
    setPhoto("");
    setPhase("init");
  }

  function confirm() {
    onCapture(photo);
  }

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), []);

  // Upload fallback
  const fileRef = useRef<HTMLInputElement>(null);
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setPhoto(b64);
    setPhase("preview");
  }

  if (phase === "init") {
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="w-28 h-28 rounded-full bg-orange-500/10 border-2 border-dashed border-orange-500/40 flex items-center justify-center">
          <span className="text-5xl">🤳</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">Foto de reconhecimento facial</p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Posicione seu rosto na frente da câmera em um ambiente bem iluminado.
            Esta foto será usada para verificação de identidade.
          </p>
        </div>
        <button
          onClick={startCamera}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors active:scale-95"
        >
          📷 Abrir câmera
        </button>
        <div className="flex items-center gap-3 w-full">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs text-neutral-600">ou</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-2xl border border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white font-medium text-sm transition-colors"
        >
          Enviar foto do dispositivo
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleUpload} />
      </div>
    );
  }

  if (phase === "live") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-[4/3]">
          {/* Flipped camera preview (selfie) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Face oval guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-56 rounded-full border-2 border-orange-500/60 border-dashed" />
          </div>

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-7xl font-black text-white drop-shadow-lg">{countdown}</span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-neutral-400 text-center">
          Centralize seu rosto no oval e clique em capturar
        </p>

        <button
          onClick={beginCapture}
          disabled={countdown !== null}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-sm transition-colors active:scale-95"
        >
          {countdown !== null ? `Capturando em ${countdown}...` : "📸 Capturar foto"}
        </button>
      </div>
    );
  }

  if (phase === "preview") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[4/3]">
          <img src={photo} alt="Foto facial" className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            ✓ Capturada
          </div>
        </div>

        <p className="text-xs text-neutral-400 text-center">
          Sua foto foi capturada. Ela ficará boa para verificação?
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={retake}
            className="flex-1 py-3 rounded-2xl border border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
          >
            Tirar novamente
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors active:scale-95"
          >
            Usar esta foto ✓
          </button>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <span className="text-4xl">⚠️</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-white">Câmera indisponível</p>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs">{errMsg}</p>
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors"
      >
        Enviar foto do dispositivo
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleUpload} />

      {photo && (
        <button
          onClick={onSkip}
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Pular por agora (não recomendado)
        </button>
      )}
    </div>
  );
}

// ─── main onboarding wizard ───────────────────────────────────────────────────

export default function MotoboyOnboarding() {
  const motoboy       = useMotoboysAuthStore((s) => s.currentMotoboy);
  const updateSession = useMotoboysAuthStore((s) => s.updateSession);
  const updateMotoboy = useFlowStore((s) => s.updateMotoboy);
  const logout        = useMotoboysAuthStore((s) => s.logout);

  const [step, setStep] = useState(0); // 0-3
  const [submitted, setSubmitted] = useState(false);

  const [name,         setName]         = useState(motoboy?.name         ?? "");
  const [phone,        setPhone]        = useState(motoboy?.phone        ?? "");
  const [vehicle,      setVehicle]      = useState(motoboy?.vehicle      ?? "Moto");
  const [vehicleModel, setVehicleModel] = useState(motoboy?.vehicleModel ?? "");
  const [plate,        setPlate]        = useState(motoboy?.plate === "—" ? "" : (motoboy?.plate ?? ""));
  const [cnhPhoto,     setCnhPhoto]     = useState(motoboy?.cnhPhoto     ?? "");
  const [facePhoto,    setFacePhoto]    = useState(motoboy?.facePhoto    ?? "");

  const cnhInputRef = useRef<HTMLInputElement>(null);

  async function handleCnhUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    setCnhPhoto(b64);
  }

  function finishOnboarding(face: string) {
    if (!motoboy) return;
    const updates = {
      name:         name.trim(),
      phone:        phone.trim(),
      vehicle,
      vehicleModel: vehicleModel.trim(),
      plate:        plate.trim() || "—",
      cnhPhoto:     cnhPhoto || undefined,
      facePhoto:    face     || undefined,
      onboarded:    true,
    };
    updateMotoboy(motoboy.id, updates);
    updateSession(updates);
  }

  function validateStep0() {
    setSubmitted(true);
    if (!name.trim()) return;
    setSubmitted(false);
    setStep(1);
  }

  function validateStep1() {
    setStep(2);
  }

  const STEPS = [
    "Dados pessoais",
    "Seu veículo",
    "Documentos",
    "Foto facial",
  ];

  if (!motoboy) return null;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
        <div>
          <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Primeiro acesso</p>
          <h1 className="text-xl font-black text-white mt-0.5">Complete seu perfil</h1>
        </div>
        <button
          onClick={logout}
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Step indicator */}
      <div className="px-5 pb-4 space-y-2 shrink-0">
        <StepDots current={step} total={STEPS.length} />
        <p className="text-center text-xs text-neutral-500">
          Passo {step + 1} de {STEPS.length} — <span className="text-neutral-300">{STEPS[step]}</span>
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="max-w-sm mx-auto space-y-4">

          {/* ── Step 0: Dados pessoais ── */}
          {step === 0 && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/15 text-orange-400 font-black text-xl flex items-center justify-center mx-auto mb-3">
                  {motoboy.avatar}
                </div>
                <p className="text-sm text-neutral-400">
                  Olá, <span className="text-white font-bold">{motoboy.name.split(" ")[0]}</span>! Vamos confirmar seus dados.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Nome completo *</label>
                  <input
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputCls} ${submitted && !name.trim() ? "border-red-500/60" : ""}`}
                  />
                  {submitted && !name.trim() && (
                    <p className="text-xs text-red-400 mt-1">Nome obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">WhatsApp</label>
                  <input
                    placeholder="(11) 99999-9999"
                    value={phone}
                    inputMode="numeric"
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                onClick={validateStep0}
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors active:scale-95 mt-2"
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── Step 1: Veículo ── */}
          {step === 1 && (
            <>
              <div className="text-center py-4">
                <span className="text-5xl">🏍️</span>
                <p className="text-sm text-neutral-400 mt-3">Informe os dados do seu veículo.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Tipo de veículo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVehicle(v)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          vehicle === v
                            ? "bg-orange-500/15 border-orange-500 text-orange-400"
                            : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                        }`}
                      >
                        {v === "Moto" ? "🏍️" : v === "Bicicleta" ? "🚲" : v === "Carro" ? "🚗" : "🚐"} {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Modelo</label>
                  <input
                    placeholder="Ex: Honda CG 160, Yamaha Factor..."
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Placa</label>
                  <input
                    placeholder="ABC-1234"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className={`${inputCls} font-mono tracking-widest`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3.5 rounded-2xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  onClick={validateStep1}
                  className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors active:scale-95"
                >
                  Continuar →
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: CNH ── */}
          {step === 2 && (
            <>
              <div className="text-center py-4">
                <span className="text-5xl">🪪</span>
                <p className="text-sm font-bold text-white mt-3">Foto da CNH</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Envie uma foto nítida da sua carteira de habilitação.
                </p>
              </div>

              {cnhPhoto ? (
                <div className="rounded-2xl overflow-hidden border border-neutral-700 relative">
                  <img src={cnhPhoto} alt="CNH" className="w-full h-44 object-cover" />
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ✓ Enviada
                  </div>
                  <button
                    onClick={() => cnhInputRef.current?.click()}
                    className="w-full py-2 bg-neutral-900/80 text-xs text-neutral-400 hover:text-white transition-colors backdrop-blur-sm"
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => cnhInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-orange-500/50 bg-neutral-800/30 flex flex-col items-center justify-center gap-3 transition-all"
                >
                  <span className="text-4xl opacity-40">🪪</span>
                  <span className="text-sm text-neutral-500">Toque para enviar foto da CNH</span>
                  <span className="text-xs text-neutral-700">JPG ou PNG · Frente e verso</span>
                </button>
              )}

              <input
                ref={cnhInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCnhUpload}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-2xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!cnhPhoto}
                  className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors active:scale-95"
                >
                  Continuar →
                </button>
              </div>

              {!cnhPhoto && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full text-xs text-neutral-700 hover:text-neutral-500 transition-colors py-1"
                >
                  Pular por agora (envie depois pelo gerente)
                </button>
              )}
            </>
          )}

          {/* ── Step 3: Facial ── */}
          {step === 3 && (
            <>
              <div className="text-center py-2">
                <p className="text-sm font-bold text-white">Reconhecimento facial</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Esta foto é registrada uma única vez e usada para verificar sua identidade.
                </p>
              </div>

              <CameraCapture
                onCapture={(base64) => finishOnboarding(base64)}
                onSkip={() => finishOnboarding("")}
              />

              <button
                onClick={() => setStep(2)}
                className="w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-1 mt-1"
              >
                ← Voltar para documentos
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
