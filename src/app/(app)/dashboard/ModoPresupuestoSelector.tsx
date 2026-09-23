"use client";

import { useRouter } from "next/navigation";

export function ModoPresupuestoSelector({ year, month, modo }: { year: number; month: number; modo: "original" | "ultima" }) {
  const router = useRouter();

  function cambiar(nextModo: string) {
    router.push(`/dashboard?year=${year}&month=${month}&modo=${nextModo}`);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      Comparar contra
      <select
        value={modo}
        onChange={(e) => cambiar(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="ultima">Última versión del presupuesto</option>
        <option value="original">Presupuesto original</option>
      </select>
    </label>
  );
}
