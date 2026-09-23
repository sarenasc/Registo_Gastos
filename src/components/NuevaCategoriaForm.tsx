"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearCategoria, type CrearCategoriaState } from "@/app/(app)/registro/actions";
import { FRECUENCIA_LABEL, PRIORIDAD_LABEL, TIPO_LABEL } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
    >
      {pending ? "Creando..." : "Crear categoría"}
    </button>
  );
}

export function NuevaCategoriaForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CrearCategoriaState, FormData>(crearCategoria, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        + Nueva categoría
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nombre</label>
        <input name="name" required className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tipo</label>
        <select name="type" className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800">
          {Object.entries(TIPO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Prioridad</label>
        <select name="priority" defaultValue="MEDIA" className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800">
          {Object.entries(PRIORIDAD_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Frecuencia habitual</label>
        <select name="frequency" defaultValue="MENSUAL" className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800">
          {Object.entries(FRECUENCIA_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton />
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:underline">
        cancelar
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
