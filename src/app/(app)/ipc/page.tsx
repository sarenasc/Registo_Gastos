import Link from "next/link";
import { obtenerSerieIpc, ipcAcumulado } from "@/lib/ipc";
import { MESES } from "@/lib/constants";
import { IpcCalculadora } from "./IpcCalculadora";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type SearchParams = Promise<{ year?: string }>;

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}%`;

export default async function IpcPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const actual = new Date().getFullYear();
  const year = Number(params.year) || actual;
  // Solo los ultimos 4 años (la fuente es lenta); si se pide un año anterior se agrega ese.
  const serie = await obtenerSerieIpc(Math.min(actual - 3, year), actual);

  if (serie.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">IPC</h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          No se pudo obtener el IPC desde mindicador.cl en este momento. Intenta de nuevo en unos minutos.
        </p>
      </div>
    );
  }

  const ultimo = serie[serie.length - 1];
  const inicio12 = serie[Math.max(0, serie.length - 12)];
  const acum12 = ipcAcumulado(serie, inicio12, ultimo);
  const delAnio = serie.filter((s) => s.year === year);
  const years = Array.from({ length: 6 }, (_, i) => actual - 5 + i);

  let factor = 1;
  const filas = delAnio.map((s) => {
    factor *= 1 + s.valor / 100;
    return { ...s, acumulado: (factor - 1) * 100 };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">IPC y ajustes</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Variación mensual del IPC de Chile (datos del INE / Banco Central, vía mindicador.cl). Úsalo para reajustar montos o el presupuesto del
          próximo año.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Último dato publicado</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pct(ultimo.valor)}</p>
          <p className="text-xs text-slate-400">
            {MESES[ultimo.month - 1]} {ultimo.year}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Acumulado últimos {acum12.meses} meses</p>
          <p className="mt-1 text-2xl font-semibold text-[#d03b3b]">{pct(acum12.porcentaje)}</p>
          <p className="text-xs text-slate-400">
            {MESES[inicio12.month - 1]} {inicio12.year} a {MESES[ultimo.month - 1]} {ultimo.year}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Para tu presupuesto</p>
          <p className="mt-1 text-sm text-slate-600">
            Usa el acumulado de 12 meses como ajuste al{" "}
            <Link href={`/presupuesto?year=${actual + 1}`} className="text-emerald-700 underline">
              crear el presupuesto {actual + 1}
            </Link>
            .
          </p>
        </div>
      </div>

      <IpcCalculadora serie={serie} sugerido={acum12.porcentaje} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">IPC mensual {year}</h2>
          <div className="flex flex-wrap gap-1">
            {years.map((y) => (
              <Link
                key={y}
                href={`/ipc?year=${y}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  y === year ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2">Mes</th>
                <th className="px-3 py-2 text-right">Variación mensual</th>
                <th className="px-3 py-2 text-right">Acumulado en el año</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    Sin datos publicados para {year}.
                  </td>
                </tr>
              ) : (
                filas.map((f) => (
                  <tr key={f.month} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-1.5 text-slate-800">{MESES[f.month - 1]}</td>
                    <td className="px-3 py-1.5 text-right">{pct(f.valor)}</td>
                    <td className="px-3 py-1.5 text-right font-medium">{pct(f.acumulado)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
