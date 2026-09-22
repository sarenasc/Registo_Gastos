"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function actualizarPresupuestoCategoria(categoryId: string, year: number, montosPorMes: number[]) {
  await prisma.$transaction(
    montosPorMes.map((monto, idx) =>
      prisma.budgetItem.upsert({
        where: { categoryId_year_month: { categoryId, year, month: idx + 1 } },
        update: { plannedAmount: monto },
        create: { categoryId, year, month: idx + 1, plannedAmount: monto },
      })
    )
  );
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function actualizarCategoria(
  categoryId: string,
  data: { type: "INGRESO" | "COSTO" | "GASTO"; priority: "ALTA" | "MEDIA" | "BAJA"; frequency: "DIARIA" | "SEMANAL" | "MENSUAL" | "ANUAL" | "PUNTUAL" }
) {
  await prisma.category.update({ where: { id: categoryId }, data });
  revalidatePath("/presupuesto");
  revalidatePath("/registro");
  revalidatePath("/dashboard");
}

export async function archivarCategoria(categoryId: string) {
  await prisma.category.update({ where: { id: categoryId }, data: { archived: true } });
  revalidatePath("/presupuesto");
  revalidatePath("/registro");
}
