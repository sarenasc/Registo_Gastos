"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Lock, Pencil } from "lucide-react";
import { cerrarPresupuesto, editarPresupuestoCerrado } from "./actions";

type Plan = { id: string; version: number; status: "ABIERTO" | "CERRADO"; closedAt: string | null };

export function PlanEstadoBar({ plan, historial, year, versionVista }: { plan: Plan; historial: Plan[]; year: number; versionVista: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            plan.status === "CERRADO" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {plan.status === "CERRADO" ? "Cerrado" : "Abierto"} · versión {plan.version}
        </span>
        {plan.status === "CERRADO" && plan.closedAt && (
          <span className="text-xs text-slate-400">
            Cerrado el {new Date(plan.closedAt).toLocaleDateString("es-CL", { timeZone: "UTC" })}
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>·</span>
          <span>Ver versión:</span>
          {historial.map((h) => (
            <a
              key={h.id}
              href={`/presupuesto?year=${year}&version=${h.version}`}
              className={`rounded-full px-2 py-0.5 ${
                h.version === versionVista ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" : "hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              v{h.version}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/api/presupuesto/exportar?year=${year}&version=${versionVista}`}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar a Excel
      </a>
      {plan.status === "ABIERTO" ? (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await cerrarPresupuesto(plan.id);
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          <Lock className="h-3.5 w-3.5" />
          Cerrar presupuesto {year}
        </button>
      ) : (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await editarPresupuestoCerrado(plan.id);
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar (crea versión {plan.version + 1})
        </button>
      )}
      </div>
    </div>
  );
}
