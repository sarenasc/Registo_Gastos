import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { Money } from "@/components/Money";
import { MonthSelector } from "../dashboard/MonthSelector";
import { CategoriaBarChart } from "../dashboard/CategoriaBarChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EgresosPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const requestedYear = Number(params.year);
  const requestedMonth = Number(params.month);
  const year = Number.isInteger(requestedYear) && requestedYear >= 1900 && requestedYear <= 9999 ? requestedYear : now.getFullYear();
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : now.getMonth() + 1;
  const [categories, movements] = await Promise.all([
    prisma.category.findMany({ where: { type: { in: ["GASTO", "COSTO"] } }, orderBy: { name: "asc" } }),
    prisma.movement.groupBy({
      by: ["categoryId"],
      where: { category: { type: { in: ["GASTO", "COSTO"] } }, date: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) } },
      _sum: { amount: true },
    }),
  ]);
  const totals = new Map(movements.map((m) => [m.categoryId, toNumber(m._sum.amount ?? 0)]));
  const items = categories.filter((c) => !c.archived || totals.has(c.id)).map((c) => ({
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
      <div className={panel}>
        <h2 className="text-lg font-semibold">Detalle de egresos</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">La clasificación se administra en el menú <Link href="/categorias" className="font-medium text-emerald-700 underline dark:text-emerald-400">Categorías</Link>.</p>
        <p className="mt-1 text-xs text-slate-500">Los montos incluyen los movimientos diarios y el registro mensual, igual que el dashboard principal.</p>
        {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aún no hay categorías de gastos o costos.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="p-2">Categoría</th><th scope="col" className="p-2">Tipo</th><th scope="col" className="p-2">Fijo / variable</th><th scope="col" className="p-2 text-right">Real del mes</th>
              </tr></thead>
              <tbody>{items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="p-2">{item.name}{item.archived && <span className="ml-2 text-xs text-slate-500">Archivada</span>}</td>
                  <td className="p-2">{item.type === "COSTO" ? "Costo" : "Gasto"}</td>
                  <td className="p-2">{item.naturaleza === "FIJO" ? "Fijo" : item.naturaleza === "VARIABLE" ? "Variable" : "Sin clasificar"}</td>
                  <td className="p-2 text-right font-medium"><Money value={item.real} /></td>
                </tr>
              ))}</tbody>
              <tfoot><tr><th scope="row" colSpan={3} className="p-2">Total</th><td className="p-2 text-right font-semibold"><Money value={total} /></td></tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
