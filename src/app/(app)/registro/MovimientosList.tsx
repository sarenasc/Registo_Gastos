"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarMovimiento } from "./actions";
import { SignedMoney } from "@/components/Money";
import { TIPO_LABEL } from "@/lib/constants";

type Movimiento = {
  id: string;
  date: Date;
  amount: unknown;
  note: string | null;
  receiptUrl: string | null;
  category: { name: string; type: string };
};

export function MovimientosList({ movimientos }: { movimientos: Movimiento[] }) {
  const [isPending, startTransition] = useTransition();

  if (movimientos.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay movimientos registrados.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {movimientos.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {m.category.name}
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {TIPO_LABEL[m.category.type]}
              </span>
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {new Date(m.date).toLocaleDateString("es-CL", { timeZone: "UTC" })}
              {m.note ? ` · ${m.note}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {m.receiptUrl && (
              <a href={m.receiptUrl} target="_blank" rel="noreferrer" title="Ver boleta" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.receiptUrl} alt="Boleta" className="h-9 w-9 rounded-md border border-slate-200 object-cover" />
              </a>
            )}
            <SignedMoney value={m.amount as number} tipo={m.category.type} className="text-sm" />
            <button
              aria-label="Eliminar movimiento"
              disabled={isPending}
              onClick={() => startTransition(() => eliminarMovimiento(m.id))}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
