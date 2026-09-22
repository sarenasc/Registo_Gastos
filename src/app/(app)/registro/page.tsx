import { getCategorias, getMovimientos } from "@/lib/queries";
import { RegistroForm } from "./RegistroForm";
import { NuevaCategoriaForm } from "./NuevaCategoriaForm";
import { MovimientosList } from "./MovimientosList";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const [categorias, movimientos] = await Promise.all([getCategorias(), getMovimientos(30)]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Registro</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Registra tus ingresos, costos y gastos apenas ocurran: diarios, semanales o mensuales.
        </p>
      </div>

      {categorias.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Todavía no hay categorías. Crea la primera abajo.
        </p>
      ) : (
        <RegistroForm categorias={categorias} />
      )}

      <NuevaCategoriaForm />

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-100">Últimos movimientos</h2>
        <MovimientosList movimientos={movimientos} />
      </div>
    </div>
  );
}
