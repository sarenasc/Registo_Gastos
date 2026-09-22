"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/lib/chart-colors";
import { formatCLP } from "@/lib/format";
import type { PuntoTendencia } from "@/lib/queries";

export function TendenciaChart({ datos }: { datos: PuntoTendencia[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Ingresos vs. gastos — últimos meses</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={datos} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.inkMuted, fontSize: 12 }} axisLine={{ stroke: CHART.axis }} tickLine={false} />
          <YAxis
            tick={{ fill: CHART.inkMuted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat("es-CL", { notation: "compact" }).format(v)}
          />
          <Tooltip formatter={(v) => formatCLP(Array.isArray(v) ? Number(v[0]) : Number(v))} contentStyle={{ fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke={CHART.ingresos} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="gastos" name="Gastos" stroke={CHART.gastos} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
