import Link from "next/link";
import { getCategorias, getPresupuestoAnio } from "@/lib/queries";
import { PresupuestoTable } from "./PresupuestoTable";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string }>;

export default async function PresupuestoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const years = [year - 1, year, year + 1];

  const [categorias, presupuestos] = await Promise.all([getCategorias(), getPresupuestoAnio(year)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Presupuesto {year}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Define cuánto planificas ingresar y gastar por categoría en cada mes. Aquí también clasificas tipo y prioridad.
          </p>
        </div>
        <div className="flex gap-1">
          {years.map((y) => (
            <Link
              key={y}
              href={`/presupuesto?year=${y}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                y === year ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      {categorias.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Aún no hay categorías. Crea la primera en{" "}
          <Link href="/registro" className="underline">
            Registro
          </Link>
          .
        </p>
      ) : (
        <PresupuestoTable categorias={categorias} presupuestos={presupuestos} year={year} />
      )}
    </div>
  );
}
