import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { Money } from "@/components/Money";
import { MonthSelector } from "../dashboard/MonthSelector";
import { CategoriaBarChart } from "../dashboard/CategoriaBarChart";
import { ComparacionEgresos } from "./ComparacionEgresos";
import { filtroImputacion } from "@/lib/imputacion";

export const dynamic = "force-dynamic";

export default async function EgresosPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const requestedYear = Number(params.year);
  const requestedMonth = Number(params.month);
  const year = Number.isInteger(requestedYear) && requestedYear >= 1900 && requestedYear <= 9999 ? requestedYear : now.getFullYear();
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : now.getMonth() + 1;
  const [categories, movements] = await Promise.all([
    prisma.category.findMany({ where: { archived: false, type: { in: ["GASTO", "COSTO"] } }, orderBy: { name: "asc" } }),
    prisma.movement.groupBy({
      by: ["categoryId"],
      where: { category: { archived: false, type: { in: ["GASTO", "COSTO"] } }, ...filtroImputacion(new Date(Date.UTC(year, month - 1, 1)), new Date(Date.UTC(year, month, 1))) },
      _sum: { amount: true },
    }),
  ]);
  const totals = new Map(movements.map((m) => [m.categoryId, toNumber(m._sum.amount ?? 0)]));
  const items = categories.map((c) => ({
    ...c, real: totals.get(c.id) ?? 0, nombre: c.name, tipo: c.type, prioridad: c.priority,
  }));
  const total = items.reduce((sum, item) => sum + item.real, 0);
  const panel = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950";
  const groups = [{ value: "FIJO", label: "Fijos" }, { value: "VARIABLE", label: "Variables" }, { value: null, label: "Sin clasificar" }];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Gastos y costos</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Egresos del mes: fijos, variables y pendientes de clasificar.</p>
        </div>
        <MonthSelector year={year} month={month} basePath="/egresos" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: "Total de egresos", amount: total }, ...groups.map((g) => ({ label: g.label, amount: items.filter((i) => i.naturaleza === g.value).reduce((sum, i) => sum + i.real, 0) }))].map((stat) => (
          <div key={stat.label} className={panel}>
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-red-600"><Money value={stat.amount} /></p>
          </div>
        ))}
      </div>
      <CategoriaBarChart items={items} />
      <ComparacionEgresos
        fijos={items.filter((i) => i.naturaleza === "FIJO").reduce((sum, i) => sum + i.real, 0)}
        variables={items.filter((i) => i.naturaleza === "VARIABLE").reduce((sum, i) => sum + i.real, 0)}
        sinClasificar={items.filter((i) => i.naturaleza === null).reduce((sum, i) => sum + i.real, 0)}
      />
    </div>
  );
}
