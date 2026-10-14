"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/server";

export async function eliminarCategoria(id: string, confirmar = false): Promise<{ error?: string; advertencia?: string }> {
  if (!await getSession()) return { error: "Inicia sesión para eliminar categorías." };
  try {
    const categoria = await prisma.category.findFirst({
      where: { id, archived: false },
      select: { name: true, _count: { select: { movements: true, budgetItems: true, adviceItems: true } } },
    });
    if (!categoria) return { error: "La categoría ya no está disponible." };
    if (!confirmar) {
      const { movements, budgetItems, adviceItems } = categoria._count;
      const tieneDatos = movements + budgetItems + adviceItems > 0;
      return { advertencia: `${categoria.name}: ${tieneDatos ? `tiene datos asociados (${movements} movimientos, ${budgetItems} registros de presupuesto y ${adviceItems} consejos). ` : ""}Se ocultará de la aplicación y sus datos se conservarán. ¿Quieres eliminarla?` };
    }
    await prisma.category.updateMany({ where: { id, archived: false }, data: { archived: true } });
    for (const ruta of ["/categorias", "/registro", "/registro/mensual", "/presupuesto", "/dashboard", "/egresos", "/consejos"]) revalidatePath(ruta);
    return {};
  } catch {
    return { error: "No se pudo eliminar la categoría. Intenta nuevamente." };
  }
}

export async function clasificarEgreso(categoryId: string, naturaleza: string): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Inicia sesión para cambiar la clasificación." };
  if (!["FIJO", "VARIABLE", ""].includes(naturaleza)) return { error: "Clasificación inválida." };
  try {
    const result = await prisma.category.updateMany({
      where: { id: categoryId, type: { in: ["GASTO", "COSTO"] }, archived: false },
      data: { naturaleza: naturaleza === "FIJO" ? "FIJO" : naturaleza === "VARIABLE" ? "VARIABLE" : null },
    });
    if (result.count === 0) return { error: "No se encontró la categoría." };
    revalidatePath("/egresos");
    revalidatePath("/categorias");
    return {};
  } catch {
    return { error: "No se pudo guardar la clasificación. Intenta nuevamente." };
  }
}
