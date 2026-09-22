import { formatCLP } from "@/lib/format";
import type { ResumenMes } from "@/lib/queries";

export function StatCards({ resumen, presupuestoTotal }: { resumen: ResumenMes; presupuestoTotal: number }) {
  const pctPresupuesto = presupuestoTotal > 0 ? resumen.gastosYCostos / presupuestoTotal : 0;
  const saldoPositivo = resumen.saldo >= 0;

  const cards = [
    { label: "Ingresos del mes", value: formatCLP(resumen.ingresos), tone: "text-[#2a78d6]" },
    { label: "Gastos y costos del mes", value: formatCLP(resumen.gastosYCostos), tone: "text-[#eb6834]" },
    {
      label: "Saldo del mes",
      value: formatCLP(resumen.saldo),
      tone: saldoPositivo ? "text-[#0ca30c]" : "text-[#d03b3b]",
    },
    {
      label: "% del presupuesto usado",
      value: presupuestoTotal > 0 ? `${(pctPresupuesto * 100).toFixed(0)}%` : "—",
      tone: pctPresupuesto > 1 ? "text-[#d03b3b]" : "text-slate-900 dark:text-slate-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${c.tone}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
