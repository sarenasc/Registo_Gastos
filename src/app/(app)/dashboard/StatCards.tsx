import { Money } from "@/components/Money";
import type { ResumenMes } from "@/lib/queries";

export function StatCards({ resumen }: { resumen: ResumenMes }) {
  const pctIngresoGastado = resumen.ingresos > 0 ? resumen.gastosYCostos / resumen.ingresos : null;
  const saldoPositivo = resumen.saldo >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ingresos del mes</p>
        <p className="mt-1 text-2xl font-semibold">
          <Money value={resumen.ingresos} className="text-[#2a78d6]" />
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Gastos y costos del mes</p>
        <p className="mt-1 text-2xl font-semibold">
          <Money value={resumen.gastosYCostos} className="text-[#eb6834]" />
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo del mes</p>
        <p className="mt-1 text-2xl font-semibold">
          <Money value={resumen.saldo} className={saldoPositivo ? "text-[#0ca30c]" : "text-[#d03b3b]"} />
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">% del ingreso gastado</p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            pctIngresoGastado !== null && pctIngresoGastado > 1 ? "text-[#d03b3b]" : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {pctIngresoGastado !== null ? `${(pctIngresoGastado * 100).toFixed(0)}%` : "—"}
        </p>
      </div>
    </div>
  );
}
