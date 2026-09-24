import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategorias } from "@/lib/queries";
import { NuevoProductoForm } from "./NuevoProductoForm";
import { ConsumoPlanner } from "./ConsumoPlanner";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; item?: string }>;

export default async function ConsumoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();

  const [items, categorias] = await Promise.all([prisma.consumptionItem.findMany({ orderBy: { name: "asc" } }), getCategorias()]);
  const item = items.find((i) => i.id === params.item) ?? items[0] ?? null;

  const [planes, planPpto, hayAnterior] = item
    ? await Promise.all([
        prisma.consumptionPlan.findMany({ where: { itemId: item.id, year } }),
        prisma.budgetPlan.findFirst({ where: { year }, orderBy: { version: "desc" } }),
        prisma.budgetPlan.findFirst({ where: { year: year - 1 } }),
      ])
    : [[], null, null];

  const years = [year - 1, year, year + 1];
  const enlace = (y: number, itemId?: string) => `/consumo?year=${y}${itemId ? `&item=${itemId}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cálculo de consumo</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Proyecta el gasto mensual de productos que compras seguido (pan, leche, etc.): precio, cuánto consumes cada día de la semana y se calcula cada
          mes según el calendario. El precio puede ser por kilo o por unidad.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {items.map((i) => (
          <Link
            key={i.id}
            href={enlace(year, i.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              item?.id === i.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {i.name}
          </Link>
        ))}
        <NuevoProductoForm />
      </div>

      {!item ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Aún no hay productos. Crea el primero con &quot;+ Nuevo producto&quot; (por ejemplo, Pan).
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {item.name} {year}
            </h2>
            <div className="flex gap-1">
              {years.map((y) => (
                <Link
                  key={y}
                  href={enlace(y, item.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    y === year ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          </div>

          <ConsumoPlanner
            key={`${item.id}-${year}`}
            year={year}
            item={{ id: item.id, name: item.name, priceBasis: item.priceBasis, quantityBasis: item.quantityBasis, unitWeightGrams: item.unitWeightGrams }}
            guardados={planes.map((p) => ({ month: p.month, price: Number(p.price), qtyPorDia: p.qtyPorDia }))}
            categorias={categorias.map((c) => ({ id: c.id, name: c.name }))}
            estadoPpto={planPpto ? { status: planPpto.status, version: planPpto.version } : null}
            hayAnterior={!!hayAnterior}
          />
        </>
      )}
    </div>
  );
}
