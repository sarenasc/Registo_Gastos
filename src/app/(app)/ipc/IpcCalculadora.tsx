"use client";

import { useMemo, useState } from "react";
import { ipcAcumulado, type IpcMes } from "@/lib/ipc";
import { MESES } from "@/lib/constants";
import { formatCLP } from "@/lib/format";
import { usePrivacy } from "@/lib/privacy-context";

export function IpcCalculadora({ serie, sugerido }: { serie: IpcMes[]; sugerido: number }) {
  const { hidden } = usePrivacy();
  const ultimo = serie[serie.length - 1];
  const primero = serie[Math.max(0, serie.length - 12)];

  const [monto, setMonto] = useState("100000");
  const [desdeMes, setDesdeMes] = useState(String(primero.month));
  const [desdeYear, setDesdeYear] = useState(String(primero.year));
  const [hastaMes, setHastaMes] = useState(String(ultimo.month));
  const [hastaYear, setHastaYear] = useState(String(ultimo.year));

  const years = useMemo(() => Array.from(new Set(serie.map((s) => s.year))), [serie]);

  const calculo = useMemo(
    () => ipcAcumulado(serie, { year: Number(desdeYear), month: Number(desdeMes) }, { year: Number(hastaYear), month: Number(hastaMes) }),
    [serie, desdeYear, desdeMes, hastaYear, hastaMes]
  );

  const base = Number(monto) || 0;
  const ajustado = Math.round(base * calculo.factor);
  const sel = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">Calculadora de reajuste por IPC</h2>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Monto a reajustar ($)</label>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={`${sel} w-36`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Desde</label>
          <div className="flex gap-1">
            <select value={desdeMes} onChange={(e) => setDesdeMes(e.target.value)} className={sel}>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select value={desdeYear} onChange={(e) => setDesdeYear(e.target.value)} className={sel}>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Hasta</label>
          <div className="flex gap-1">
            <select value={hastaMes} onChange={(e) => setHastaMes(e.target.value)} className={sel}>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select value={hastaYear} onChange={(e) => setHastaYear(e.target.value)} className={sel}>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">IPC acumulado del período ({calculo.meses} meses)</p>
          <p className="text-xl font-semibold text-slate-900">{calculo.porcentaje.toFixed(2).replace(".", ",")}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Monto reajustado</p>
          <p className="text-xl font-semibold text-[#d03b3b]">{hidden ? "•••••" : formatCLP(ajustado)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Diferencia</p>
          <p className="text-xl font-semibold text-slate-900">{hidden ? "•••••" : formatCLP(ajustado - base)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Incluye ambos meses del rango. Referencia para reajustar el presupuesto: {sugerido.toFixed(2).replace(".", ",")}% (últimos 12 meses publicados).
      </p>
    </div>
  );
}
