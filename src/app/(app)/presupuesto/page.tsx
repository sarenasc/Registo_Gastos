import Link from "next/link";
import { getCategorias } from "@/lib/queries";
import { obtenerOCrearPlanEditable, obtenerPlanPorVersion, historialDeVersiones } from "@/lib/presupuesto";
import { PresupuestoTable } from "./PresupuestoTable";
import { PlanEstadoBar } from "./PlanEstadoBar";
import { NuevaCategoriaForm } from "@/components/NuevaCategoriaForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; version?: string }>;

export default async function PresupuestoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();
  const years = [year - 1, year, year + 1];

  const [categorias, planActivo, historial] = await Promise.all([getCategorias(), obtenerOCrearPlanEditable(year), historialDeVersiones(year)]);

  const versionParam = params.version ? Number(params.version) : null;
  let plan = planActivo;
  let soloLectura = planActivo.status === "CERRADO";

  if (versionParam && versionParam !== planActivo.version) {
    const otro = await obtenerPlanPorVersion(year, versionParam);
    if (otro) {
      plan = otro;
      soloLectura = true;
    }
  }

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

      <PlanEstadoBar
        plan={{ id: plan.id, version: plan.version, status: plan.status, closedAt: plan.closedAt ? plan.closedAt.toISOString() : null }}
        historial={historial.map((h) => ({ id: h.id, version: h.version, status: h.status, closedAt: h.closedAt ? h.closedAt.toISOString() : null }))}
        year={year}
        versionVista={plan.version}
      />

      {soloLectura && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Estás viendo la versión {plan.version}, en modo solo lectura.{" "}
          <Link href={`/presupuesto?year=${year}`} className="underline">
            Ir a la versión actual
          </Link>
          .
        </p>
      )}

      <NuevaCategoriaForm />

      {categorias.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">Aún no hay categorías. Crea la primera arriba.</p>
      ) : (
        <PresupuestoTable categorias={categorias} plan={plan} year={year} readOnly={soloLectura} />
      )}
    </div>
  );
}
