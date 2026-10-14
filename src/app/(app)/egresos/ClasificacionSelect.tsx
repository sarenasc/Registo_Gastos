"use client";

import { useState, useTransition } from "react";
import { clasificarEgreso } from "./actions";

export function ClasificacionSelect({ id, nombre, naturaleza }: { id: string; nombre: string; naturaleza: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div>
      <select
        aria-label={`Clasificación de ${nombre}`}
        value={naturaleza ?? ""}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value;
          setError(undefined);
          startTransition(async () => {
            const result = await clasificarEgreso(id, value);
            setError(result.error);
          });
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">Sin clasificar</option>
        <option value="FIJO">Fijo</option>
        <option value="VARIABLE">Variable</option>
      </select>
      {pending && <span role="status" className="ml-2 text-xs text-slate-500">Guardando…</span>}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
