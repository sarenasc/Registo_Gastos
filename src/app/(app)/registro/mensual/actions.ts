"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOTA_REGISTRO_MENSUAL } from "@/lib/queries";

export async function actualizarMovimientoMensual(categoryId: string, year: number, montosPorMes: number[]) {
  for (let i = 0; i < montosPorMes.length; i++) {
    const month = i + 1;
    const monto = montosPorMes[i];
    const desde = new Date(Date.UTC(year, month - 1, 1));
    const hasta = new Date(Date.UTC(year, month, 1));

    const existente = await prisma.movement.findFirst({
      where: { categoryId, frequency: "MENSUAL", note: NOTA_REGISTRO_MENSUAL, date: { gte: desde, lt: hasta } },
    });

    if (monto <= 0) {
      if (existente) await prisma.movement.delete({ where: { id: existente.id } });
      continue;
    }

    if (existente) {
      await prisma.movement.update({ where: { id: existente.id }, data: { amount: monto } });
    } else {
      await prisma.movement.create({
        data: { categoryId, date: desde, amount: monto, frequency: "MENSUAL", note: NOTA_REGISTRO_MENSUAL },
      });
    }
  }

  revalidatePath("/registro/mensual");
  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/consejos");
}
