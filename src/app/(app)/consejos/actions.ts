"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function actualizarEstadoConsejo(id: string, status: "PENDIENTE" | "APLICADO" | "DESCARTADO") {
  await prisma.adviceItem.update({ where: { id }, data: { status } });
  revalidatePath("/consejos");
}

export async function guardarInsightRegla(categoryId: string, titulo: string, descripcion: string, montoPotencial: number) {
  const existente = await prisma.adviceItem.findFirst({
    where: { categoryId, title: titulo, status: { not: "DESCARTADO" } },
  });
  if (existente) return;

  await prisma.adviceItem.create({
    data: {
      categoryId,
      title: titulo,
      description: descripcion,
      source: "REGLA",
      estimatedSavings: montoPotencial,
      status: "PENDIENTE",
    },
  });
  revalidatePath("/consejos");
}
