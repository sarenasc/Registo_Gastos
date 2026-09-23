"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOTA_REGISTRO_MENSUAL } from "@/lib/queries";

export async function actualizarMovimientoMensual(categoryId: string, year: number, montosPorMes: number[], presupuestoPorMes: number[]) {
  for (let i = 0; i < montosPorMes.length; i++) {
    const month = i + 1;
    const monto = montosPorMes[i];
    const desde = new Date(Date.UTC(year, month - 1, 1));
    const hasta = new Date(Date.UTC(year, month, 1));

    const existente = await prisma.movement.findFirst({
      where: { categoryId, frequency: "MENSUAL", note: NOTA_REGISTRO_MENSUAL, date: { gte: desde, lt: hasta } },
    });

    // Un 0 solo se guarda si habia presupuesto ese mes: asi queda explicito
    // que el real fue 0 y la casilla no vuelve a mostrar el borrador del presupuesto.
    if (monto <= 0 && (presupuestoPorMes[i] ?? 0) <= 0) {
      if (existente) await prisma.movement.delete({ where: { id: existente.id } });
      continue;
    }

    const valor = Math.max(monto, 0);
    if (existente) {
      await prisma.movement.update({ where: { id: existente.id }, data: { amount: valor } });
    } else {
      await prisma.movement.create({
        data: { categoryId, date: desde, amount: valor, frequency: "MENSUAL", note: NOTA_REGISTRO_MENSUAL },
      });
    }
  }

  revalidatePath("/registro/mensual");
  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/consejos");
}
