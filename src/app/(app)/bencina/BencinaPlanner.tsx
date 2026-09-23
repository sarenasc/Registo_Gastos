"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { aplicarBencinaAlPresupuesto, guardarPlanBencina } from "./actions";
import { calcularBencina, DIAS_SEMANA } from "@/lib/bencina";
import { MESES } from "@/lib/constants";
import { Money } from "@/components/Money";

type Guardado = { month: number; pricePerLiter: number; kmPerLiter: number; kmPorDia: number[] };
type Fila = { pricePerLiter: number; kmPerLiter: number; kmPorDia: number[] };

const FILA_VACIA: Fila = { pricePerLiter: 0, kmPerLiter: 10, kmPorDia: Array(7).fill(0) };

const nf = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

export function BencinaPlanner({ year, guardados, categorias }: { year: number; guardados: Guardado[]; categorias: { id: string; name: string }[] }) {
  const [filas, setFilas] = useState<Fila[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const g = guardados.find((x) => x.month === i + 1);
      return g ? { pricePerLiter: g.pricePerLiter, kmPerLiter: g.kmPerLiter, kmPorDia: g.kmPorDia } : { ...FILA_VACIA, kmPorDia: [...FILA_VACIA.kmPorDia] };
    })
  );
  const [precioGlobal, setPrecioGlobal] = useState(String(filas[0].pricePerLiter || ""));
  const [rendGlobal, setRendGlobal] = useState(String(filas[0].kmPerLiter || 10));
  const [diasSel, setDiasSel] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [kmGrupo, setKmGrupo] = useState("");
  const [mesDestino, setMesDestino] = useState("0");
  const [categoriaId, setCategoriaId] = useState(categorias.find((c) => /bencina|combustible/i.test(c.name))?.id ?? categorias[0]?.id ?? "");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const resultados = useMemo(
    () => filas.map((f, i) => calcularBencina(year, i + 1, f.kmPorDia, f.kmPerLiter, f.pricePerLiter)),
    [filas, year]
  );
  const totales = resultados.reduce((a, r) => ({ km: a.km + r.kmMes, litros: a.litros + r.litros, costo: a.costo + r.costo }), { km: 0, litros: 0, costo: 0 });

  function actualizarFila(idx: number, cambio: Partial<Fila>) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, ...cambio } : f)));
  }

  function aplicarGlobales() {
    const precio = Number(precioGlobal) || 0;
    const rend = Number(rendGlobal) || 0;
    setFilas((prev) => prev.map((f) => ({ ...f, pricePerLiter: precio, kmPerLiter: rend })));
  }

  function aplicarKmGrupo() {
    const km = Math.max(0, Math.round(Number(kmGrupo) || 0));
    setFilas((prev) =>
      prev.map((f, i) => {
        if (mesDestino !== "0" && Number(mesDestino) !== i + 1) return f;
        return { ...f, kmPorDia: f.kmPorDia.map((v, d) => (diasSel[d] ? km : v)) };
      })
    );
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarPlanBencina(
        year,
        filas.map((f, i) => ({ month: i + 1, pricePerLiter: f.pricePerLiter, kmPerLiter: f.kmPerLiter, kmPorDia: f.kmPorDia }))
      );
      setMensaje(res?.error ? { tipo: "error", texto: res.error } : { tipo: "ok", texto: "Plan de bencina guardado." });
    });
  }

  function aplicarAlPresupuesto() {
    setMensaje(null);
    startTransition(async () => {
      // Guarda primero para que el presupuesto use exactamente lo que ves en pantalla.
      const guardadoRes = await guardarPlanBencina(
        year,
        filas.map((f, i) => ({ month: i + 1, pricePerLiter: f.pricePerLiter, kmPerLiter: f.kmPerLiter, kmPorDia: f.kmPorDia }))
      );
      if (guardadoRes?.error) return setMensaje({ tipo: "error", texto: guardadoRes.error });
      const res = await aplicarBencinaAlPresupuesto(year, categoriaId);
      setMensaje(res.error ? { tipo: "error", texto: res.error } : { tipo: "ok", texto: res.ok ?? "Listo." });
    });
  }

  const inputBase = "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Precio por litro ($)</label>
            <input type="number" value={precioGlobal} onChange={(e) => setPrecioGlobal(e.target.value)} className={clsx(inputBase, "w-28")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Rendimiento (km por litro)</label>
            <input type="number" step="0.1" value={rendGlobal} onChange={(e) => setRendGlobal(e.target.value)} className={clsx(inputBase, "w-28")} />
          </div>
          <button onClick={aplicarGlobales} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900">
            Aplicar a todos los meses
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {DIAS_SEMANA.map((d, i) => (
              <button
                key={d}
                onClick={() => setDiasSel((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  diasSel[i] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Km por día en esos días</label>
              <input type="number" value={kmGrupo} onChange={(e) => setKmGrupo(e.target.value)} placeholder="140" className={clsx(inputBase, "w-28")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Aplicar a</label>
              <select value={mesDestino} onChange={(e) => setMesDestino(e.target.value)} className={inputBase}>
                <option value="0">Todos los meses</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={aplicarKmGrupo} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900">
              Aplicar km
            </button>
          </div>
          <p className="text-xs text-slate-400">Marca los días (por ejemplo Lun–Vie), escribe los km y aplícalo. Después puedes ajustar cualquier día en la tabla.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-3 py-2">Mes</th>
              <th className="px-2 py-2">$/litro</th>
              <th className="px-2 py-2">km/l</th>
              {DIAS_SEMANA.map((d) => (
                <th key={d} className="px-1 py-2 text-right">
                  {d}
                </th>
              ))}
              <th className="px-2 py-2 text-right">Km mes</th>
              <th className="px-2 py-2 text-right">Litros</th>
              <th className="px-2 py-2 text-right">Costo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-1.5 font-medium text-slate-800">{MESES[i]}</td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={f.pricePerLiter}
                    onChange={(e) => actualizarFila(i, { pricePerLiter: Number(e.target.value) || 0 })}
                    className={clsx(inputBase, "w-20 text-right text-xs")}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={f.kmPerLiter}
                    onChange={(e) => actualizarFila(i, { kmPerLiter: Number(e.target.value) || 0 })}
                    className={clsx(inputBase, "w-16 text-right text-xs")}
                  />
                </td>
                {f.kmPorDia.map((km, d) => (
                  <td key={d} className="px-1 py-1.5">
                    <input
                      type="number"
                      value={km}
                      onChange={(e) => actualizarFila(i, { kmPorDia: f.kmPorDia.map((v, j) => (j === d ? Math.max(0, Math.round(Number(e.target.value) || 0)) : v)) })}
                      className={clsx(inputBase, "w-14 text-right text-xs")}
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right text-xs text-slate-700">{nf.format(resultados[i].kmMes)}</td>
                <td className="px-2 py-1.5 text-right text-xs text-slate-700">{nf.format(resultados[i].litros)}</td>
                <td className="px-2 py-1.5 text-right text-xs font-semibold text-[#d03b3b]">
                  <Money value={resultados[i].costo} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-semibold">
              <td className="px-3 py-2 text-slate-700" colSpan={10}>
                Total {year}
              </td>
              <td className="px-2 py-2 text-right">{nf.format(totales.km)}</td>
              <td className="px-2 py-2 text-right">{nf.format(totales.litros)}</td>
              <td className="px-2 py-2 text-right text-[#d03b3b]">
                <Money value={totales.costo} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={guardar}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Guardar plan
        </button>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Categoría del presupuesto</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputBase}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={aplicarAlPresupuesto}
          disabled={isPending || !categoriaId}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Usar como presupuesto {year}
        </button>
        {mensaje && <p className={clsx("text-sm", mensaje.tipo === "ok" ? "text-emerald-700" : "text-red-600")}>{mensaje.texto}</p>}
      </div>
    </div>
  );
}
