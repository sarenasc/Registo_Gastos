"use client";

import { Money } from "@/components/Money";
import { usePrivacy } from "@/lib/privacy-context";

export function ComparacionEgresos({ fijos, variables, sinClasificar }: { fijos: number; variables: number; sinClasificar: number }) {
  const { hidden } = usePrivacy();
  const total = fijos + variables + sinClasificar;
  const groups = [
    { label: "Fijos", amount: fijos, color: "bg-indigo-500" },
    { label: "Variables", amount: variables, color: "bg-amber-500" },
    { label: "Sin clasificar", amount: sinClasificar, color: "bg-slate-400" },
  ];
  const pct = (amount: number) => total > 0 ? amount / total * 100 : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-lg font-semibold">Fijos vs. variables</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {total === 0 ? "Sin egresos registrados este mes." : fijos === variables ? "Los egresos fijos y variables tienen el mismo monto." : fijos > variables ? "Este mes predominan los egresos fijos." : "Este mes predominan los egresos variables."}
      </p>
      {total > 0 && (
        <div role="img" aria-label={hidden ? "Comparación de egresos del mes" : groups.map((g) => `${g.label}: ${pct(g.amount).toFixed(1)}%`).join(", ")} className="mt-4 flex h-8 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {groups.filter((g) => g.amount > 0).map((g) => (
            <div key={g.label} className={g.color} style={{ width: `${pct(g.amount)}%` }} />
          ))}
        </div>
      )}
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {groups.map((g) => (
          <li key={g.label} className="text-sm">
            <span className="flex items-center gap-2"><span aria-hidden="true" className={`h-3 w-3 rounded-full ${g.color}`} />{g.label}</span>
            <p className="mt-1 font-semibold"><Money value={g.amount} /> <span className="font-normal text-slate-500">({pct(g.amount).toFixed(1)}%)</span></p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">Porcentaje del total de egresos del mes. Los pendientes de clasificar se muestran por separado.</p>
    </section>
  );
}
