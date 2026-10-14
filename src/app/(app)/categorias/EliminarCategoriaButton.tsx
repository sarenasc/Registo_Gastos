"use client";

import { useState, useTransition } from "react";
import { eliminarCategoria } from "./actions";

export function EliminarCategoriaButton({ id, nombre }: { id: string; nombre: string }) {
  const [pending, startTransition] = useTransition();
  const [advertencia, setAdvertencia] = useState<string>();
  const [error, setError] = useState<string>();
  function eliminar(confirmar = false) {
    setError(undefined);
    startTransition(async () => {
      const result = await eliminarCategoria(id, confirmar);
      setAdvertencia(result.advertencia);
      setError(result.error);
    });
  }
  return (
    <div>
      {advertencia ? (
        <div className="max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p role="alert" className="text-sm">{advertencia}</p>
          <div className="mt-2 flex gap-3">
            <button type="button" disabled={pending} onClick={() => eliminar(true)} className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">Confirmar eliminación</button>
            <button type="button" disabled={pending} onClick={() => setAdvertencia(undefined)} className="text-sm underline">Cancelar</button>
          </div>
        </div>
      ) : <button type="button" disabled={pending} aria-label={`Eliminar categoría ${nombre}`} onClick={() => eliminar()} className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">{pending ? "Procesando…" : "Eliminar"}</button>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
