"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { guardarInsightRegla } from "./actions";
import { formatCLP } from "@/lib/format";
import type { InsightRegla } from "@/lib/consejos-reglas";

export function InsightsRegla({ insights }: { insights: InsightRegla[] }) {
  const [isPending, startTransition] = useTransition();

  if (insights.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Sin alertas automáticas este mes: no hay categorías sobre presupuesto ni de prioridad baja con gasto.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {insights.map((i, idx) => (
        <li
          key={`${i.categoryId}-${idx}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-slate-800">{i.mensaje}</p>
              <p className="text-xs text-slate-400">Ahorro potencial: {formatCLP(i.montoPotencial)}</p>
            </div>
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => guardarInsightRegla(i.categoryId, i.titulo, i.mensaje, i.montoPotencial))}
            className="shrink-0 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Guardar
          </button>
        </li>
      ))}
    </ul>
  );
}
