import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCLP } from "@/lib/format";
import type { TotalPorCategoria } from "@/lib/queries";

export function PresupuestoVsRealList({ items }: { items: TotalPorCategoria[] }) {
  const conPresupuesto = items
    .filter((i) => i.presupuestado > 0 || i.real > 0)
    .filter((i) => i.tipo !== "INGRESO")
    .map((i) => ({ ...i, delta: i.real - i.presupuestado }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 8);

  if (conPresupuesto.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Presupuesto vs. real</h3>
        <p className="text-sm text-slate-500">Aún no hay presupuesto definido para este mes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Presupuesto vs. real — mayores diferencias</h3>
      <ul className="flex flex-col gap-2">
        {conPresupuesto.map((item) => {
          const sobrePresupuesto = item.delta > 0;
          return (
            <li key={item.categoryId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-slate-700">{item.nombre}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="text-slate-400">
                  {formatCLP(item.real)} / {formatCLP(item.presupuestado)}
                </span>
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    sobrePresupuesto ? "bg-red-50 text-[#d03b3b]" : "bg-green-50 text-[#0ca30c]"
                  }`}
                >
                  {sobrePresupuesto ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatCLP(Math.abs(item.delta))}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
