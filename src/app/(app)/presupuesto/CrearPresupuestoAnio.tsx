"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { crearPresupuestoAnio } from "./actions";

export function CrearPresupuestoAnio({ year, hayAnterior }: { year: number; hayAnterior: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ajuste, setAjuste] = useState("0");

  function crear(copiar: boolean) {
    startTransition(async () => {
      await crearPresupuestoAnio(year, copiar, copiar ? Number(ajuste) || 0 : 0);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">El presupuesto {year} aún no está creado</h2>
        <p className="mt-1 text-sm text-slate-500">Elige cómo partir. No se crea nada hasta que lo confirmes.</p>
      </div>

      {hayAnterior && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Ajustar montos del {year - 1} en % (ej. IPC)</label>
            <input
              type="number"
              step="0.1"
              value={ajuste}
              onChange={(e) => setAjuste(e.target.value)}
              className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            disabled={isPending}
            onClick={() => crear(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <FilePlus2 className="h-4 w-4" />
            Crear {year} copiando el {year - 1}
          </button>
          <Link href="/ipc" className="text-xs text-emerald-700 underline">
            Ver IPC para calcular el ajuste
          </Link>
        </div>
      )}

      <div>
        <button
          disabled={isPending}
          onClick={() => crear(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Crear {year} en blanco
        </button>
      </div>
    </div>
  );
}
