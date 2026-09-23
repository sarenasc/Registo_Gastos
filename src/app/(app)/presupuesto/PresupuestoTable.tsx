"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Archive, Check } from "lucide-react";
import { actualizarCategoria, actualizarPresupuestoCategoria, archivarCategoria, renombrarCategoria } from "./actions";
import { MESES, PRIORIDAD_LABEL, TIPO_LABEL } from "@/lib/constants";
import { Money, SignedMoney } from "@/components/Money";

type Categoria = {
  id: string;
  name: string;
  type: "INGRESO" | "COSTO" | "GASTO";
  priority: "ALTA" | "MEDIA" | "BAJA";
  frequency: "DIARIA" | "SEMANAL" | "MENSUAL" | "ANUAL" | "PUNTUAL";
};

type BudgetItem = { categoryId: string; month: number; plannedAmount: unknown };

function CategoriaRow({ categoria, montosIniciales, year }: { categoria: Categoria; montosIniciales: number[]; year: number }) {
  const [montos, setMontos] = useState(montosIniciales);
  const [type, setType] = useState(categoria.type);
  const [priority, setPriority] = useState(categoria.priority);
  const [name, setName] = useState(categoria.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = montos.reduce((a, b) => a + b, 0);
  const dirty = JSON.stringify(montos) !== JSON.stringify(montosIniciales);
  const esIngreso = type === "INGRESO";

  function guardarMontos() {
    startTransition(async () => {
      await actualizarPresupuestoCategoria(categoria.id, year, montos);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function cambiarClasificacion(nextType: typeof type, nextPriority: typeof priority) {
    setType(nextType);
    setPriority(nextPriority);
    startTransition(() => actualizarCategoria(categoria.id, { type: nextType, priority: nextPriority, frequency: categoria.frequency }));
  }

  function guardarNombre() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === categoria.name) {
      setName(categoria.name);
      return;
    }
    startTransition(async () => {
      const res = await renombrarCategoria(categoria.id, trimmed);
      if (res?.error) {
        setNameError(res.error);
        setName(categoria.name);
      } else {
        setNameError(null);
      }
    });
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="sticky left-0 z-[1] bg-white px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={guardarNombre}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-32 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-slate-800 hover:border-slate-200 focus:border-emerald-400 focus:bg-white focus:outline-none"
        />
        {nameError && <p className="text-xs text-red-600">{nameError}</p>}
      </td>
      <td className="px-2 py-2">
        <select
          value={type}
          onChange={(e) => cambiarClasificacion(e.target.value as typeof type, priority)}
          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
        >
          {Object.entries(TIPO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          value={priority}
          onChange={(e) => cambiarClasificacion(type, e.target.value as typeof priority)}
          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
        >
          {Object.entries(PRIORIDAD_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      {montos.map((m, idx) => (
        <td key={idx} className="px-1 py-2">
          <input
            type="number"
            value={m}
            onChange={(e) => {
              const next = [...montos];
              next[idx] = Number(e.target.value) || 0;
              setMontos(next);
            }}
            className={clsx(
              "w-20 rounded-md border border-slate-200 px-1.5 py-1 text-right text-xs font-medium",
              esIngreso ? "text-[#2a78d6]" : "text-[#d03b3b]"
            )}
          />
        </td>
      ))}
      <td className="px-2 py-2 text-right text-xs">
        <SignedMoney value={total} tipo={type} />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={guardarMontos}
            disabled={!dirty || isPending}
            className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : "Guardar"}
          </button>
          <button
            onClick={() => startTransition(() => archivarCategoria(categoria.id))}
            title="Archivar categoría"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PresupuestoTable({ categorias, presupuestos, year }: { categorias: Categoria[]; presupuestos: BudgetItem[]; year: number }) {
  const montosPorCategoria = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of categorias) map.set(c.id, Array(12).fill(0));
    for (const p of presupuestos) {
      const arr = map.get(p.categoryId);
      if (arr) arr[p.month - 1] = Number(p.plannedAmount as number) || 0;
    }
    return map;
  }, [categorias, presupuestos]);

  const saldoPorMes = useMemo(() => {
    const saldos = Array(12).fill(0);
    for (const c of categorias) {
      const montos = montosPorCategoria.get(c.id) ?? Array(12).fill(0);
      const signo = c.type === "INGRESO" ? 1 : -1;
      montos.forEach((m, idx) => (saldos[idx] += signo * m));
    }
    return saldos;
  }, [categorias, montosPorCategoria]);

  const saldoAnual = saldoPorMes.reduce((a, b) => a + b, 0);

  const thBase = "sticky top-0 z-[2] bg-slate-50 px-2 py-2";

  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
            <th className={clsx(thBase, "sticky left-0 z-[3] px-3")}>Categoría</th>
            <th className={thBase}>Tipo</th>
            <th className={thBase}>Prioridad</th>
            {MESES.map((m) => (
              <th key={m} className={clsx(thBase, "px-1 text-right")}>
                {m.slice(0, 3)}
              </th>
            ))}
            <th className={clsx(thBase, "text-right")}>Total</th>
            <th className={thBase}></th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <CategoriaRow key={c.id} categoria={c} montosIniciales={montosPorCategoria.get(c.id) ?? Array(12).fill(0)} year={year} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-semibold">
            <td className="sticky left-0 z-[1] bg-slate-50 px-3 py-2 text-slate-700">Saldo del mes</td>
            <td className="px-2 py-2" colSpan={2}></td>
            {saldoPorMes.map((s, idx) => (
              <td key={idx} className={clsx("px-1 py-2 text-right", s >= 0 ? "text-[#0ca30c]" : "text-[#d03b3b]")}>
                <Money value={s} />
              </td>
            ))}
            <td className={clsx("px-2 py-2 text-right", saldoAnual >= 0 ? "text-[#0ca30c]" : "text-[#d03b3b]")}>
              <Money value={saldoAnual} />
            </td>
            <td className="px-2 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
