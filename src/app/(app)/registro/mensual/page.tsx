import Link from "next/link";
import { getCategorias, getMovimientosMensualesAnio } from "@/lib/queries";
import { obtenerPlanParaComparar } from "@/lib/presupuesto";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { ExportarRegistroMensual } from "./ExportarRegistroMensual";
import { RegistroMensualTable } from "./RegistroMensualTable";
import { RegistroTabs } from "../RegistroTabs";
import { NuevaCategoriaForm } from "@/components/NuevaCategoriaForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string }>;

export default async function RegistroMensualPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const years = [year - 1, year, year + 1];

  const [categorias, registros, planPpto] = await Promise.all([
    getCategorias(),
    getMovimientosMensualesAnio(year),
    obtenerPlanParaComparar(year, "ultima"),
  ]);

  const presupuesto = planPpto
    ? (await prisma.budgetItem.findMany({ where: { planId: planPpto.id } })).map((i) => ({
        categoryId: i.categoryId,
        month: i.month,
        amount: toNumber(i.plannedAmount),
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <RegistroTabs />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Registro mensual {year}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ingresa de una vez el total real del mes por categoría, sin anotar cada compra. No afecta el Presupuesto — se compara contra él en el
            Dashboard.
          </p>
        </div>
        <div className="flex gap-1">
          {years.map((y) => (
            <Link
              key={y}
              href={`/registro/mensual?year=${y}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                y === year ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <ExportarRegistroMensual year={year} />

      <NuevaCategoriaForm />

      {categorias.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Aún no hay categorías. Crea la primera arriba o en{" "}
          <Link href="/registro" className="underline">
            Registro
          </Link>
          .
        </p>
      ) : (
        <RegistroMensualTable categorias={categorias} registros={registros} presupuesto={presupuesto} year={year} />
      )}
    </div>
  );
}
