"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/server";

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
