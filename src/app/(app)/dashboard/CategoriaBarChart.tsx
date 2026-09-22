"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/lib/chart-colors";
import { formatCLP } from "@/lib/format";

type Item = { nombre: string; real: number; prioridad: string };

const PRIORIDAD_OPACITY: Record<string, number> = { ALTA: 1, MEDIA: 0.75, BAJA: 0.5 };

export function CategoriaBarChart({ items }: { items: Item[] }) {
  const top = [...items]
    .filter((i) => i.real > 0)
    .sort((a, b) => b.real - a.real)
    .slice(0, 10)
    .reverse();

  if (top.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Gasto por categoría (top 10)</h3>
        <p className="text-sm text-slate-500">Sin movimientos este mes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Gasto por categoría (top 10)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART.inkMuted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat("es-CL", { notation: "compact" }).format(v)}
          />
          <YAxis type="category" dataKey="nombre" width={130} tick={{ fill: CHART.ink, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => formatCLP(Array.isArray(v) ? Number(v[0]) : Number(v))} contentStyle={{ fontSize: 13 }} />
          <Bar dataKey="real" name="Gasto real" radius={[0, 4, 4, 0]}>
            {top.map((item) => (
              <Cell key={item.nombre} fill={CHART.sequential} fillOpacity={PRIORIDAD_OPACITY[item.prioridad] ?? 0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-400">Color más intenso = prioridad más alta.</p>
    </div>
  );
}
