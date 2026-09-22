import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTotalesPorCategoria } from "@/lib/queries";
import { candidatosParaIA } from "@/lib/consejos-reglas";
import { generarConsejosConIA } from "@/lib/anthropic";

export async function POST() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const totales = await getTotalesPorCategoria(year, month);
  const candidatos = candidatosParaIA(totales, 8);

  if (candidatos.length === 0) {
    return NextResponse.json({ creados: 0, mensaje: "No hay categorías sobre presupuesto o de baja prioridad este mes." });
  }

  const nombreToId = new Map(totales.map((t) => [t.nombre.toLowerCase(), t.categoryId]));

  let consejos;
  try {
    consejos = await generarConsejosConIA(candidatos);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido llamando a la IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (consejos.length === 0) {
    return NextResponse.json({ creados: 0, mensaje: "La IA no encontró sugerencias esta vez." });
  }

  const creados = await prisma.$transaction(
    consejos.map((c) =>
      prisma.adviceItem.create({
        data: {
          categoryId: nombreToId.get(c.categoria.toLowerCase()) ?? null,
          title: c.titulo,
          description: c.descripcion,
          source: "IA",
          estimatedSavings: c.ahorro_estimado_mensual || null,
          sourceUrl: c.url_fuente || null,
          status: "PENDIENTE",
        },
      })
    )
  );

  return NextResponse.json({ creados: creados.length });
}
