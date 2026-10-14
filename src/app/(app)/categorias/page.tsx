import { prisma } from "@/lib/prisma";
import { ClasificacionSelect } from "./ClasificacionSelect";
import { NuevaCategoriaForm } from "@/components/NuevaCategoriaForm";
import { EliminarCategoriaButton } from "./EliminarCategoriaButton";
import { TIPO_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await prisma.category.findMany({
    where: { archived: false },
    select: { id: true, name: true, type: true, naturaleza: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Categorías</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Define cuáles gastos y costos son fijos o variables. Los cambios se guardan automáticamente, son compartidos y se aplican a todos los meses.</p>
      </div>
      <NuevaCategoriaForm />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {categorias.length === 0 ? <p className="text-sm text-slate-500">Aún no hay categorías. Agrega la primera con Nueva categoría.</p> : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="p-2">Categoría</th>
                <th scope="col" className="p-2">Tipo</th>
                <th scope="col" className="p-2">Fijo / variable</th>
                <th scope="col" className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>{categorias.map((categoria) => (
              <tr key={categoria.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-2">{categoria.name}</td>
                <td className="p-2">{TIPO_LABEL[categoria.type]}</td>
                <td className="p-2">{categoria.type === "INGRESO" ? "No aplica" : <ClasificacionSelect id={categoria.id} nombre={categoria.name} naturaleza={categoria.naturaleza} />}</td>
                <td className="p-2"><EliminarCategoriaButton id={categoria.id} nombre={categoria.name} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
