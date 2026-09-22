"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearMovimiento, type CrearMovimientoState } from "./actions";
import { FRECUENCIA_LABEL, TIPO_LABEL } from "@/lib/constants";

type Categoria = { id: string; name: string; type: string; frequency: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Registrar movimiento"}
    </button>
  );
}

export function RegistroForm({ categorias }: { categorias: Categoria[] }) {
  const [state, formAction] = useActionState<CrearMovimientoState, FormData>(crearMovimiento, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categorias[0]?.id ?? "");
  const selectedCategory = categorias.find((c) => c.id === selectedCategoryId);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
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

      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
