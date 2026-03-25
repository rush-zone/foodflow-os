"use client";

import { useRef, useState } from "react";
import { useFlowStore, FlowMotoboy } from "@/store/useFlowStore";

// ─── constants ───────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ["Moto", "Bicicleta", "Carro", "Van"];

const inputCls =
  "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-brand-primary/60 transition-colors";

const labelCls = "text-[10px] font-bold text-neutral-500 uppercase tracking-wider";

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function downloadBase64(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href     = dataUrl;
  a.download = filename;
  a.click();
}

// ─── photo upload widget ──────────────────────────────────────────────────────

interface PhotoUploadProps {
  label:       string;
  hint:        string;
  icon:        string;
  value:       string;
  onChange:    (base64: string) => void;
  downloadName?: string; // if provided, shows download button
}

function PhotoUpload({ label, hint, icon, value, onChange, downloadName }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFileAsBase64(file);
    onChange(b64);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className={labelCls}>{label}</p>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-neutral-700">
          {/* Preview */}
          <img
            src={value}
            alt={label}
            className="w-full h-36 object-cover"
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              Trocar foto
            </button>
            {downloadName && (
              <button
                type="button"
                onClick={() => downloadBase64(value, downloadName)}
                className="px-3 py-1.5 rounded-lg bg-brand-primary/80 hover:bg-brand-primary text-white text-xs font-bold backdrop-blur-sm transition-colors"
              >
                ⬇ Download
              </button>
            )}
          </div>

          {/* Download button always visible below image */}
          {downloadName && (
            <button
              type="button"
              onClick={() => downloadBase64(value, downloadName)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              ⬇ Baixar {label}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-neutral-700 hover:border-brand-primary/50 bg-neutral-800/50 hover:bg-neutral-800 flex flex-col items-center justify-center gap-2 transition-all group"
        >
          <span className="text-3xl opacity-40 group-hover:opacity-70 transition-opacity">{icon}</span>
          <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors font-medium">
            Clique para enviar
          </span>
          <span className="text-[10px] text-neutral-600">{hint}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── form state ───────────────────────────────────────────────────────────────

interface FormState {
  name:         string;
  phone:        string;
  vehicle:      string;
  vehicleModel: string;
  plate:        string;
  pin:          string;
  cnhPhoto:     string;
  facePhoto:    string;
}

const emptyForm: FormState = {
  name: "", phone: "", vehicle: "Moto", vehicleModel: "", plate: "", pin: "", cnhPhoto: "", facePhoto: "",
};

function motoboyToForm(m: FlowMotoboy): FormState {
  return {
    name:         m.name,
    phone:        m.phone,
    vehicle:      m.vehicle,
    vehicleModel: m.vehicleModel ?? "",
    plate:        m.plate === "—" ? "" : m.plate,
    pin:          m.pin,
    cnhPhoto:     m.cnhPhoto  ?? "",
    facePhoto:    m.facePhoto ?? "",
  };
}

// ─── profile form ─────────────────────────────────────────────────────────────

function MotoboyForm({
  initial,
  motoboy,
  onSave,
  onCancel,
}: {
  initial:  FormState;
  motoboy?: FlowMotoboy; // undefined = new motoboy
  onSave:   (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm]         = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    setSubmitted(true);
    if (!form.name.trim() || form.pin.length !== 4) return;
    onSave(form);
  }

  const isEdit = !!motoboy;

  return (
    <div className="space-y-5">

      {/* ── Dados pessoais ── */}
      <div>
        <p className={`${labelCls} mb-3`}>Dados pessoais</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <input
              placeholder="Nome completo *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`${inputCls} ${submitted && !form.name.trim() ? "border-red-500/60" : ""}`}
            />
            {submitted && !form.name.trim() && (
              <p className="text-xs text-red-400 mt-1 px-1">Nome obrigatório</p>
            )}
          </div>

          <input
            placeholder="Telefone"
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
            inputMode="numeric"
            className={inputCls}
          />

          <div>
            <input
              placeholder="PIN (4 dígitos) *"
              value={form.pin}
              onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              className={`${inputCls} font-mono tracking-[0.3em] ${submitted && form.pin.length !== 4 ? "border-red-500/60" : ""}`}
            />
            {submitted && form.pin.length !== 4 && (
              <p className="text-xs text-red-400 mt-1 px-1">PIN: 4 dígitos</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Veículo ── */}
      <div>
        <p className={`${labelCls} mb-3`}>Veículo</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <select
              value={form.vehicle}
              onChange={(e) => set("vehicle", e.target.value)}
              className={`${inputCls} appearance-none pr-8`}
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-xs">▾</span>
          </div>

          <input
            placeholder="Modelo (ex: Honda CG 160)"
            value={form.vehicleModel}
            onChange={(e) => set("vehicleModel", e.target.value)}
            className={inputCls}
          />

          <input
            placeholder="Placa (ex: ABC-1234)"
            value={form.plate}
            onChange={(e) => set("plate", e.target.value.toUpperCase())}
            className={`${inputCls} col-span-1 font-mono`}
          />
        </div>
      </div>

      {/* ── Documentos (somente no edit) ── */}
      {isEdit && (
        <div>
          <p className={`${labelCls} mb-3`}>Documentos</p>
          <div className="grid grid-cols-2 gap-3">
            <PhotoUpload
              label="Foto da CNH"
              hint="JPG, PNG ou WEBP"
              icon="🪪"
              value={form.cnhPhoto}
              onChange={(v) => set("cnhPhoto", v)}
              downloadName={`CNH_${form.name.replace(/\s+/g, "_")}.jpg`}
            />
            <PhotoUpload
              label="Foto facial"
              hint="Frente ao fundo claro"
              icon="🤳"
              value={form.facePhoto}
              onChange={(v) => set("facePhoto", v)}
            />
          </div>
        </div>
      )}

      {/* ── Ações ── */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors"
        >
          {isEdit ? "Salvar alterações" : "Cadastrar motoboy"}
        </button>
      </div>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────

export default function MotoboyManagerModal({ onClose }: { onClose: () => void }) {
  const motoboys          = useFlowStore((s) => s.motoboys);
  const availableMotoboys = useFlowStore((s) => s.availableMotoboys);
  const addMotoboy        = useFlowStore((s) => s.addMotoboy);
  const updateMotoboy     = useFlowStore((s) => s.updateMotoboy);
  const removeMotoboy     = useFlowStore((s) => s.removeMotoboy);

  const [adding, setAdding]               = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleAdd(data: FormState) {
    addMotoboy({
      name:         data.name.trim(),
      phone:        data.phone.trim(),
      vehicle:      data.vehicle,
      vehicleModel: data.vehicleModel.trim(),
      plate:        data.plate.trim() || "—",
      source:       "proprio",
      pin:          data.pin,
    });
    setAdding(false);
  }

  function handleEdit(id: string, data: FormState) {
    updateMotoboy(id, {
      name:         data.name.trim(),
      phone:        data.phone.trim(),
      vehicle:      data.vehicle,
      vehicleModel: data.vehicleModel.trim(),
      plate:        data.plate.trim() || "—",
      pin:          data.pin,
      cnhPhoto:     data.cnhPhoto  || undefined,
      facePhoto:    data.facePhoto || undefined,
    });
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-base font-black text-white">Motoboys cadastrados</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {motoboys.length} motoboy{motoboys.length !== 1 ? "s" : ""} ·{" "}
              {motoboys.filter((m) => availableMotoboys.has(m.id)).length} disponíveis agora
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* ── Motoboy cards ── */}
          <div className="divide-y divide-neutral-800/60">
            {motoboys.map((m) => {
              const isAvailable = availableMotoboys.has(m.id);
              const isEditing   = editingId === m.id;

              return (
                <div key={m.id}>
                  {/* Card header — always visible */}
                  <div className="px-5 py-4 flex items-center gap-3">
                    {/* Avatar / face photo */}
                    <div className="relative shrink-0">
                      {m.facePhoto ? (
                        <img
                          src={m.facePhoto}
                          alt={m.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-orange-500/15 text-orange-400 font-black text-sm flex items-center justify-center border-2 border-neutral-700">
                          {m.avatar}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-neutral-900 ${isAvailable ? "bg-green-500" : "bg-neutral-500"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white">{m.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isAvailable ? "bg-green-500/20 text-green-400" : "bg-neutral-700 text-neutral-500"}`}>
                          {isAvailable ? "Disponível" : "Em rota"}
                        </span>
                        {m.cnhPhoto && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">🪪 CNH</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {m.vehicle}{m.vehicleModel ? ` · ${m.vehicleModel}` : ""}{m.plate !== "—" ? ` · ${m.plate}` : ""}
                      </p>
                      <p className="text-xs text-neutral-700 font-mono mt-0.5">
                        {m.phone || "Sem telefone"} · PIN: {m.pin}
                      </p>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => { setEditingId(isEditing ? null : m.id); setAdding(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isEditing
                            ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {isEditing ? "Fechar" : "Editar"}
                      </button>

                      {confirmDelete === m.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { removeMotoboy(m.id); setConfirmDelete(null); }}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(m.id)}
                          disabled={!isAvailable}
                          title={!isAvailable ? "Motoboy em rota — aguarde a entrega" : "Remover"}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="px-5 pb-5 bg-neutral-800/30 border-t border-neutral-800">
                      <div className="pt-4">
                        <MotoboyForm
                          initial={motoboyToForm(m)}
                          motoboy={m}
                          onSave={(data) => handleEdit(m.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {motoboys.length === 0 && !adding && (
              <div className="px-6 py-10 text-center">
                <p className="text-4xl mb-3">🏍️</p>
                <p className="text-sm text-neutral-500">Nenhum motoboy cadastrado.</p>
                <p className="text-xs text-neutral-600 mt-1">Clique em "+ Adicionar" para começar.</p>
              </div>
            )}
          </div>

          {/* ── Add form ── */}
          {adding && (
            <div className="px-5 py-5 border-t border-neutral-800 bg-neutral-800/20">
              <p className="text-xs font-bold text-green-400 mb-4">Novo motoboy</p>
              <MotoboyForm
                initial={emptyForm}
                onSave={handleAdd}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!adding && (
          <div className="px-5 py-4 border-t border-neutral-800 shrink-0">
            <button
              onClick={() => { setAdding(true); setEditingId(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white transition-colors"
            >
              + Adicionar motoboy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
