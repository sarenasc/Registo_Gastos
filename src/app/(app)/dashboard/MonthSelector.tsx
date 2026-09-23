"use client";

import { useRouter } from "next/navigation";
import { MESES } from "@/lib/constants";

export function MonthSelector({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const years = Array.from({ length: 6 }, (_, i) => year - 3 + i);

  function navegar(nextYear: number, nextMonth: number) {
    router.push(`/dashboard?year=${nextYear}&month=${nextMonth}`);
    // El router cache de Next puede reusar la version en cache de esta misma
    // ruta cuando solo cambian los searchParams; refresh() fuerza a traer
    // los datos del mes/año nuevo desde el servidor.
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => navegar(year, Number(e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
      >
        {MESES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => navegar(Number(e.target.value), month)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
