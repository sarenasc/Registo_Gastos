"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { MESES } from "@/lib/constants";

export function ExportarRegistroMensual({ year }: { year: number }) {
  const [sel, setSel] = useState<number[]>([]);

  const toggle = (m: number) => setSel((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  const ordenados = [...sel].sort((a, b) => a - b);
  const href = `/api/registro/exportar?year=${year}${ordenados.length ? `&meses=${ordenados.join(",")}` : ""}`;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Exportar a Excel:</span>
        {MESES.map((nombre, i) => (
          <button
            key={nombre}
            type="button"
            onClick={() => toggle(i + 1)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              sel.includes(i + 1) ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {nombre.slice(0, 3)}
          </button>
        ))}
        <button type="button" onClick={() => setSel([])} className="text-xs text-slate-400 underline">
          limpiar
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={href}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar {ordenados.length === 0 ? "el año completo" : ordenados.length === 1 ? MESES[ordenados[0] - 1] : `${ordenados.length} meses`}
        </a>
        <span className="text-xs text-slate-400">Sin meses elegidos baja los 12. Incluye solo lo ya guardado como real (no los borradores).</span>
      </div>
    </div>
  );
}
