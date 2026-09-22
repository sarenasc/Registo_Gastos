import { getResumenMes, getTendenciaMensual, getTotalesPorCategoria } from "@/lib/queries";
import { MonthSelector } from "./MonthSelector";
import { StatCards } from "./StatCards";
import { TendenciaChart } from "./TendenciaChart";
import { CategoriaBarChart } from "./CategoriaBarChart";
import { PresupuestoVsRealList } from "./PresupuestoVsRealList";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; month?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const [resumen, totales, tendencia] = await Promise.all([
    getResumenMes(year, month),
    getTotalesPorCategoria(year, month),
    getTendenciaMensual(6, year, month),
  ]);

  const presupuestoTotal = totales.filter((t) => t.tipo !== "INGRESO").reduce((acc, t) => acc + t.presupuestado, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resumen de tu presupuesto, gastos e ingresos.</p>
        </div>
        <MonthSelector year={year} month={month} />
      </div>

      <StatCards resumen={resumen} presupuestoTotal={presupuestoTotal} />

      <TendenciaChart datos={tendencia} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoriaBarChart items={totales} />
        <PresupuestoVsRealList items={totales} />
      </div>
    </div>
  );
}
