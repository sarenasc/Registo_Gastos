"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { actualizarMovimientoMensual } from "./actions";
import { MESES } from "@/lib/constants";
import { Money, SignedMoney } from "@/components/Money";

type Categoria = { id: string; name: string; type: "INGRESO" | "COSTO" | "GASTO" };
type Registro = { categoryId: string; month: number; amount: number };

function CategoriaRow({
  categoria,
  montosIniciales,
  presupuesto,
  year,
}: {
  categoria: Categoria;
  montosIniciales: number[];
  presupuesto: number[];
  year: number;
}) {
  const [montos, setMontos] = useState(montosIniciales);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = montos.reduce((a, b) => a + b, 0);
  const dirty = JSON.stringify(montos) !== JSON.stringify(montosIniciales);
  const esIngreso = categoria.type === "INGRESO";

  function guardar() {
    startTransition(async () => {
      await actualizarMovimientoMensual(categoria.id, year, montos);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="sticky left-0 z-[1] bg-white px-3 py-2 text-sm font-medium text-slate-800">{categoria.name}</td>
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
          <span className="block pr-1.5 text-right text-[10px] text-slate-400" title="Presupuesto">
            ppto <Money value={presupuesto[idx]} />
          </span>
        </td>
      ))}
      <td className="px-2 py-2 text-right text-xs">
        <SignedMoney value={total} tipo={categoria.type} />
        <span className="block text-[10px] font-normal text-slate-400" title="Presupuesto del año">
          ppto <Money value={presupuesto.reduce((a, b) => a + b, 0)} />
        </span>
      </td>
      <td className="px-2 py-2">
        <button
          onClick={guardar}
          disabled={!dirty || isPending}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

export function RegistroMensualTable({
  categorias,
  registros,
  presupuesto,
  year,
}: {
  categorias: Categoria[];
  registros: Registro[];
  presupuesto: Registro[];
  year: number;
}) {
  const presupuestoPorCategoria = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of categorias) map.set(c.id, Array(12).fill(0));
    for (const p of presupuesto) {
      const arr = map.get(p.categoryId);
      if (arr) arr[p.month - 1] = p.amount;
    }
    return map;
  }, [categorias, presupuesto]);

  const montosPorCategoria = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of categorias) map.set(c.id, Array(12).fill(0));
    for (const r of registros) {
      const arr = map.get(r.categoryId);
      if (arr) arr[r.month - 1] = r.amount;
    }
    return map;
  }, [categorias, registros]);

  const saldoPorMes = useMemo(() => {
    const saldos = Array(12).fill(0);
    for (const c of categorias) {
      const montos = montosPorCategoria.get(c.id) ?? Array(12).fill(0);
      const signo = c.type === "INGRESO" ? 1 : -1;
      montos.forEach((m, idx) => (saldos[idx] += signo * m));
    }
    return saldos;
  }, [categorias, montosPorCategoria]);

  const thBase = "sticky top-0 z-[2] bg-slate-50 px-2 py-2";

  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
            <th className={clsx(thBase, "sticky left-0 z-[3] px-3")}>Categoría</th>
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
            <CategoriaRow
              key={c.id}
              categoria={c}
              montosIniciales={montosPorCategoria.get(c.id) ?? Array(12).fill(0)}
              presupuesto={presupuestoPorCategoria.get(c.id) ?? Array(12).fill(0)}
              year={year}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-semibold">
            <td className="sticky left-0 z-[1] bg-slate-50 px-3 py-2 text-slate-700">Saldo del mes</td>
            {saldoPorMes.map((s, idx) => (
              <td key={idx} className={clsx("px-1 py-2 text-right", s >= 0 ? "text-[#0ca30c]" : "text-[#d03b3b]")}>
                <Money value={s} />
              </td>
            ))}
            <td className={clsx("px-2 py-2 text-right", saldoPorMes.reduce((a, b) => a + b, 0) >= 0 ? "text-[#0ca30c]" : "text-[#d03b3b]")}>
              <Money value={saldoPorMes.reduce((a, b) => a + b, 0)} />
            </td>
            <td className="px-2 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
