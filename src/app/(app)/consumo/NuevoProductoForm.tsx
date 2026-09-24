"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearProducto } from "./actions";
import { necesitaPeso, UNIDAD_LABEL, type Unidad } from "@/lib/consumo";

const OPCIONES: Unidad[] = ["UNIDAD", "KILO", "LITRO"];

export function NuevoProductoForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [priceBasis, setPriceBasis] = useState<Unidad>("KILO");
  const [quantityBasis, setQuantityBasis] = useState<Unidad>("UNIDAD");
  const [peso, setPeso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pideValorPeso = necesitaPeso(priceBasis, quantityBasis);
  const sel = "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline">
        + Nuevo producto
      </button>
    );
  }

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearProducto(name, priceBasis, quantityBasis, pideValorPeso ? Number(peso) || null : null);
      if (res.error) return setError(res.error);
      setOpen(false);
      setName("");
      setPeso("");
      router.push(`/consumo?item=${res.id}`);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-wrap items-end gap-3 rounded-lg border border-dashed border-slate-300 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Producto</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pan" className={`${sel} w-36`} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">El precio que ingreso es por</label>
        <select value={priceBasis} onChange={(e) => setPriceBasis(e.target.value as Unidad)} className={sel}>
          {OPCIONES.map((u) => (
            <option key={u} value={u}>
              {UNIDAD_LABEL[u]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Anoto la cantidad en</label>
        <select value={quantityBasis} onChange={(e) => setQuantityBasis(e.target.value as Unidad)} className={sel}>
          {OPCIONES.map((u) => (
            <option key={u} value={u}>
              {UNIDAD_LABEL[u]}s
            </option>
          ))}
        </select>
      </div>
      {pideValorPeso && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Peso de 1 unidad (gramos)</label>
          <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="100" className={`${sel} w-28`} />
        </div>
      )}
      <button
        onClick={crear}
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
      >
        Crear producto
      </button>
      <button onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:underline">
        cancelar
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
