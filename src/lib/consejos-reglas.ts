import type { TotalPorCategoria } from "@/lib/queries";

export type InsightRegla = {
  categoryId: string;
  nombre: string;
  tipo: "SOBRE_PRESUPUESTO" | "PRIORIDAD_BAJA_CON_GASTO";
  titulo: string;
  mensaje: string;
  montoPotencial: number;
};

export function generarInsightsRegla(totales: TotalPorCategoria[]): InsightRegla[] {
  const insights: InsightRegla[] = [];

  for (const t of totales) {
    if (t.tipo === "INGRESO") continue;

    if (t.presupuestado > 0 && t.real > t.presupuestado) {
      const delta = t.real - t.presupuestado;
      insights.push({
        categoryId: t.categoryId,
        nombre: t.nombre,
        tipo: "SOBRE_PRESUPUESTO",
        titulo: `Sobre presupuesto: ${t.nombre}`,
        mensaje: `"${t.nombre}" superó el presupuesto en $${delta.toLocaleString("es-CL")} este mes.`,
        montoPotencial: delta,
      });
    } else if (t.prioridad === "BAJA" && t.real > 0) {
      insights.push({
        categoryId: t.categoryId,
        nombre: t.nombre,
        tipo: "PRIORIDAD_BAJA_CON_GASTO",
        titulo: `Prioridad baja con gasto: ${t.nombre}`,
        mensaje: `"${t.nombre}" es prioridad baja para ti y este mes gastaste $${t.real.toLocaleString("es-CL")}. Es candidato a reducir o eliminar.`,
        montoPotencial: t.real,
      });
    }
  }

  return insights.sort((a, b) => b.montoPotencial - a.montoPotencial).slice(0, 10);
}

export function candidatosParaIA(totales: TotalPorCategoria[], maxCandidatos = 8) {
  const insights = generarInsightsRegla(totales);
  const porCategoria = new Map(totales.map((t) => [t.categoryId, t]));

  return insights.slice(0, maxCandidatos).map((i) => {
    const t = porCategoria.get(i.categoryId)!;
    return { categoria: t.nombre, tipo: t.tipo, prioridad: t.prioridad, real: t.real, presupuestado: t.presupuestado };
  });
}
