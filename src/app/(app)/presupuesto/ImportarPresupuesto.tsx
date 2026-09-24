"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { importarPresupuestoExcel } from "./actions";

export function ImportarPresupuesto({ planId, year, version }: { planId: string; year: number; version: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ error?: string; ok?: string; ignoradas?: string[] } | null>(null);

  function subir(file: File | undefined) {
    if (!file) return;
    if (!window.confirm(`Se reemplazarán los valores del presupuesto ${year} (versión ${version}) por los del archivo "${file.name}". ¿Continuar?`)) {
      if (input.current) input.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.set("archivo", file);
    startTransition(async () => {
      const r = await importarPresupuestoExcel(planId, year, fd);
      setResultado(r);
      if (input.current) input.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept=".xlsx" hidden onChange={(e) => subir(e.target.files?.[0])} />
        <button
          type="button"
          disabled={isPending}
          onClick={() => input.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {isPending ? "Importando…" : "Subir Excel y actualizar valores"}
        </button>
        <span className="text-xs text-slate-400">
          Usa un archivo exportado desde aquí (categoría en la columna A, meses en el encabezado). Solo se cambian las celdas con número; las vacías se
          respetan.
        </span>
      </div>
      {resultado?.error && <p className="text-sm text-red-600">{resultado.error}</p>}
      {resultado?.ok && <p className="text-sm text-emerald-700">{resultado.ok}</p>}
      {resultado?.ignoradas && resultado.ignoradas.length > 0 && (
        <p className="text-xs text-amber-700">Categorías del archivo que no existen y se ignoraron: {resultado.ignoradas.join(", ")}.</p>
      )}
    </div>
  );
}
