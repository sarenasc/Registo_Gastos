"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOTA_REGISTRO_MENSUAL } from "@/lib/queries";
import { filtroImputacion } from "@/lib/imputacion";
import { getSession } from "@/lib/auth/server";
import { toNumber } from "@/lib/format";

export async function actualizarMovimientoMensual(categoryId: string, year: number, montosPorMes: number[], presupuestoPorMes: number[], meses = Array.from({ length: 12 }, (_, i) => i + 1)): Promise<{ error?: string }> {
  if (!await getSession()) return { error: "Inicia sesión para guardar." };
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || montosPorMes.length !== 12 || presupuestoPorMes.length !== 12 || !montosPorMes.every((m) => Number.isFinite(m) && m >= 0) || !meses.every((m) => Number.isInteger(m) && m >= 1 && m <= 12)) return { error: "Datos inválidos." };
  if (!await prisma.category.findFirst({ where: { id: categoryId, archived: false }, select: { id: true } })) return { error: "La categoría ya no está disponible." };
  try {
    await prisma.$transaction(async (tx) => {
      for (const month of [...new Set(meses)]) {
        const desde = new Date(Date.UTC(year, month - 1, 1));
        const hasta = new Date(Date.UTC(year, month, 1));
        const registros = await tx.movement.findMany({ where: { categoryId, ...filtroImputacion(desde, hasta) } });
        const mensuales = registros.filter((m) => m.frequency === "MENSUAL" && m.note === NOTA_REGISTRO_MENSUAL);
        const diarios = registros.filter((m) => !(m.frequency === "MENSUAL" && m.note === NOTA_REGISTRO_MENSUAL)).reduce((sum, m) => sum + toNumber(m.amount), 0);
        const resto = Math.round((montosPorMes[month - 1] - diarios) * 100) / 100;
        if (resto < 0) throw new Error("DIARIOS_SUPERAN_TOTAL");
        if (mensuales.length) {
          await tx.movement.update({ where: { id: mensuales[0].id }, data: { amount: resto } });
          for (const duplicado of mensuales.slice(1)) await tx.movement.update({ where: { id: duplicado.id }, data: { amount: 0 } });
        } else if (resto > 0 || (diarios === 0 && presupuestoPorMes[month - 1] > 0)) {
          await tx.movement.create({ data: { categoryId, date: desde, imputationDate: desde, amount: resto, frequency: "MENSUAL", note: NOTA_REGISTRO_MENSUAL } });
        }
      }
    });
  } catch (error) {
    return { error: error instanceof Error && error.message === "DIARIOS_SUPERAN_TOTAL" ? "El total es menor que los movimientos diarios de ese mes. Edita esos movimientos en Registro diario primero." : "No se pudo guardar. Intenta nuevamente." };
  }
  for (const ruta of ["/registro/mensual", "/registro", "/dashboard", "/egresos", "/consejos"]) revalidatePath(ruta);
  return {};
}
