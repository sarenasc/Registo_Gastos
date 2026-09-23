"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearMovimiento, type CrearMovimientoState } from "./actions";
import { Camera, Loader2, X } from "lucide-react";
import { FRECUENCIA_LABEL, TIPO_LABEL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const MAX_FOTO_BYTES = 10 * 1024 * 1024;

type Categoria = { id: string; name: string; type: string; frequency: string };

function SubmitButton({ bloqueado }: { bloqueado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || bloqueado}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Registrar movimiento"}
    </button>
  );
}

export function RegistroForm({ categorias }: { categorias: Categoria[] }) {
  const [state, formAction, isPending] = useActionState<CrearMovimientoState, FormData>(crearMovimiento, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categorias[0]?.id ?? "");
  const selectedCategory = categorias.find((c) => c.id === selectedCategoryId);

  const [receiptUrl, setReceiptUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  // Solo limpia el formulario cuando la acción termina SIN error (no al enviar).
  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
      setReceiptUrl("");
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  async function subirFoto(file: File | undefined) {
    if (!file) return;
    setErrorFoto(null);
    if (!file.type.startsWith("image/")) {
      setErrorFoto("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_FOTO_BYTES) {
      setErrorFoto("La foto pesa más de 10 MB.");
      return;
    }

    setSubiendo(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("boletas").upload(path, file, { contentType: file.type });
    if (error) {
      setErrorFoto("No se pudo subir la foto. Intenta de nuevo.");
    } else {
      setReceiptUrl(supabase.storage.from("boletas").getPublicUrl(path).data.publicUrl);
    }
    setSubiendo(false);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({TIPO_LABEL[c.type]})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Fecha
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={today}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Monto (CLP)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="0"
          required
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Frecuencia
        </label>
        <select
          id="frequency"
          name="frequency"
          defaultValue={selectedCategory?.frequency ?? "PUNTUAL"}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {Object.entries(FRECUENCIA_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="note" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nota (opcional)
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="Ej: compra semanal supermercado"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto de la boleta (opcional)</span>
        <input type="hidden" name="receiptUrl" value={receiptUrl} />
        {receiptUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt="Boleta" className="h-16 w-16 rounded-md border border-slate-200 object-cover" />
            <button
              type="button"
              onClick={() => setReceiptUrl("")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" /> Quitar foto
            </button>
          </div>
        ) : (
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {subiendo ? "Subiendo..." : "Tomar o subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendo}
              onChange={(e) => {
                subirFoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {errorFoto && <p className="text-xs text-red-600">{errorFoto}</p>}
      </div>

      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <SubmitButton bloqueado={subiendo} />
      </div>
    </form>
  );
}
