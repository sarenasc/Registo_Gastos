import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategorias } from "@/lib/queries";
import { BencinaPlanner } from "./BencinaPlanner";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string }>;

export default async function BencinaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const years = [year - 1, year, year + 1];

  const [planes, categorias] = await Promise.all([prisma.fuelPlan.findMany({ where: { year } }), getCategorias()]);

  const guardados = planes.map((p) => ({
    month: p.month,
    pricePerLiter: Number(p.pricePerLiter),
    kmPerLiter: Number(p.kmPerLiter),
    kmPorDia: p.kmPorDia,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cálculo de bencina {year}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Indica el precio por litro, el rendimiento de tu auto y cuántos km harás cada día de la semana. Se calcula el gasto de cada mes según
            los días que tiene el calendario.
          </p>
        </div>
        <div className="flex gap-1">
          {years.map((y) => (
            <Link
              key={y}
              href={`/bencina?year=${y}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                y === year ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <BencinaPlanner year={year} guardados={guardados} categorias={categorias.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
