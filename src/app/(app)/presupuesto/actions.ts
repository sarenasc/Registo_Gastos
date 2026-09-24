"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cerrarPlan, abrirNuevaVersion, crearPlanDelAnio } from "@/lib/presupuesto";
import { leerExcelPresupuesto, normalizar } from "@/lib/importar-presupuesto";

export async function actualizarPresupuestoCategoria(planId: string, year: number, categoryId: string, montosPorMes: number[]) {
  await prisma.$transaction(
    montosPorMes.map((monto, idx) =>
      prisma.budgetItem.upsert({
        where: { planId_categoryId_month: { planId, categoryId, month: idx + 1 } },
        update: { plannedAmount: monto },
        create: { planId, categoryId, year, month: idx + 1, plannedAmount: monto },
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

export async function renombrarCategoria(categoryId: string, name: string): Promise<{ error?: string } | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre no puede quedar vacío" };

  try {
    await prisma.category.update({ where: { id: categoryId }, data: { name: trimmed } });
  } catch {
    return { error: "Ya existe una categoría con ese nombre" };
  }
  revalidatePath("/presupuesto");
  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/consejos");
  return undefined;
}

export async function archivarCategoria(categoryId: string) {
  await prisma.category.update({ where: { id: categoryId }, data: { archived: true } });
  revalidatePath("/presupuesto");
  revalidatePath("/registro");
}

export async function cerrarPresupuesto(planId: string) {
  await cerrarPlan(planId);
  revalidatePath("/presupuesto");
}

export async function editarPresupuestoCerrado(planId: string) {
  await abrirNuevaVersion(planId);
  revalidatePath("/presupuesto");
}

export async function crearPresupuestoAnio(year: number, copiarDelAnterior: boolean, ajustePct: number) {
  await crearPlanDelAnio(year, copiarDelAnterior, Number.isFinite(ajustePct) ? ajustePct : 0);
  revalidatePath("/presupuesto");
}

export async function importarPresupuestoExcel(
  planId: string,
  year: number,
  formData: FormData
): Promise<{ error?: string; ok?: string; ignoradas?: string[] }> {
  const plan = await prisma.budgetPlan.findUnique({ where: { id: planId } });
  if (!plan) return { error: "No se encontró el presupuesto." };
  if (plan.status === "CERRADO") return { error: "El presupuesto está cerrado. Abre una nueva versión para poder importar." };

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige un archivo .xlsx." };
  if (archivo.size > 5 * 1024 * 1024) return { error: "El archivo es demasiado grande (máx. 5 MB)." };

  let celdas;
  try {
    celdas = await leerExcelPresupuesto(await archivo.arrayBuffer());
  } catch {
    return { error: "No se pudo leer el archivo. Debe ser un .xlsx válido." };
  }
  if (celdas.length === 0) return { error: "No encontré meses con valores. Usa un archivo exportado desde Presupuesto." };

  const categorias = await prisma.category.findMany({ select: { id: true, name: true } });
  const porNombre = new Map(categorias.map((c) => [normalizar(c.name), c.id]));

  const ignoradas = new Set<string>();
  const tocadas = new Set<string>();
  const operaciones = [];
  for (const c of celdas) {
    const categoryId = porNombre.get(normalizar(c.categoria));
    if (!categoryId) {
      ignoradas.add(c.categoria);
      continue;
    }
    tocadas.add(categoryId);
    operaciones.push(
      prisma.budgetItem.upsert({
        where: { planId_categoryId_month: { planId, categoryId, month: c.month } },
        update: { plannedAmount: c.monto },
        create: { planId, categoryId, year, month: c.month, plannedAmount: c.monto },
      })
    );
  }
  if (operaciones.length === 0) return { error: "Ninguna categoría del archivo coincide con las existentes.", ignoradas: [...ignoradas] };

  await prisma.$transaction(operaciones);
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
  return {
    ok: `Listo: se actualizaron ${operaciones.length} valores en ${tocadas.size} categorías del presupuesto ${year} (versión ${plan.version}).`,
    ignoradas: [...ignoradas],
  };
}
